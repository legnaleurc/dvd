import re
from collections.abc import AsyncGenerator
from contextlib import AsyncExitStack, asynccontextmanager
from datetime import datetime
from logging import getLogger

from aiohttp import hdrs
from aiohttp.abc import AbstractView
from aiohttp.web import BaseRequest, StreamResponse
from aiohttp.web_exceptions import (
    HTTPBadGateway,
    HTTPBadRequest,
    HTTPNotFound,
    HTTPNotModified,
    HTTPRequestRangeNotSatisfiable,
    HTTPUnauthorized,
)
from wcpan.drive.core.types import Drive, Node, ReadableFile

from .app import KEY_DRIVE, KEY_TOKEN
from .lib import get_node
from .rest import PermissionMixin


_L = getLogger(__name__)


class NodeObjectMixin(AbstractView):
    async def get_object(self):
        id_ = self.request.match_info.get("id", None)
        if not id_:
            raise HTTPBadRequest()

        drive = self.request.app[KEY_DRIVE]
        node = await get_node(drive, id_)
        if not node:
            raise HTTPNotFound()

        return node


class NodeRandomAccessMixin(AbstractView):
    async def create_response(self):
        return StreamResponse(status=200)

    async def setup_headers(
        self,
        response: StreamResponse,
        node: Node,
    ) -> tuple[int, int]:
        """
        Fills the headers by RFC 9110 and returns the (offset, length) to serve.
        Raises 304 if not modified, or 416 if the range is not satisfiable.
        """
        assert node.size is not None

        DEFAULT_MIME_TYPE = "application/octet-stream"

        response.content_type = (
            DEFAULT_MIME_TYPE if not node.mime_type else node.mime_type
        )
        if not is_entity_modified(
            self.request, etag=node.hash, last_modified=node.modified_time
        ):
            not_modified = HTTPNotModified()
            setup_validators(
                not_modified, etag=node.hash, last_modified=node.modified_time
            )
            raise not_modified

        setup_validators(response, etag=node.hash, last_modified=node.modified_time)
        response.headers["Accept-Ranges"] = "bytes"

        range_ = _get_file_range(self.request, node)
        if range_ is None:
            response.content_length = node.size
            return 0, node.size

        start, stop = range_
        response.set_status(206)
        response.content_length = stop - start
        response.headers["Content-Range"] = f"bytes {start}-{stop - 1}/{node.size}"
        return start, stop - start

    async def feed(
        self,
        response: StreamResponse,
        node: Node,
        range_: tuple[int, int],
    ) -> None:
        offset, length = range_
        if length <= 0:
            await response.prepare(self.request)
            return

        drive = self.request.app[KEY_DRIVE]
        async with open_download(drive, node, offset) as stream:
            await response.prepare(self.request)
            async for chunk in stream:
                chunk = chunk[:length]
                try:
                    await response.write(chunk)
                except ConnectionResetError:
                    # client closed
                    break
                length -= len(chunk)
                if length <= 0:
                    break


class HasTokenMixin(PermissionMixin, AbstractView):
    async def has_permission(self):
        token = self.request.app[KEY_TOKEN]
        if not token:
            return True
        authorization = self.request.headers.get("Authorization")
        if not authorization:
            return False
        rv = re.match(r"Token\s+(.+)", authorization)
        if not rv:
            return False
        return rv.group(1) == token

    async def raise_permission_error(self):
        raise HTTPUnauthorized(
            headers={
                "WWW-Authenticate": f"Token realm=api",
            }
        )


@asynccontextmanager
async def open_download(
    drive: Drive, node: Node, offset: int = 0
) -> AsyncGenerator[ReadableFile]:
    """
    Opens the download and starts the transfer, so the caller can still answer
    with an error status if the drive fails, before preparing its response.
    """
    async with AsyncExitStack() as stack:
        try:
            stream = await stack.enter_async_context(drive.download_file(node))
            await stream.seek(offset)
        except Exception as e:
            _L.exception(f"failed to download node {node.id}")
            raise HTTPBadGateway() from e
        yield stream


def is_entity_modified(
    request: BaseRequest, *, etag: str, last_modified: datetime
) -> bool:
    """
    https://www.rfc-editor.org/rfc/rfc9110#section-13.2.2
    """
    if etags := request.if_none_match:
        # weak comparison, and "*" matches any representation
        return all(_.value != "*" and _.value != etag for _ in etags)
    if since := request.if_modified_since:
        return last_modified > since
    # Not a conditional request, treat as modified.
    return True


def setup_validators(
    response: StreamResponse, *, etag: str, last_modified: datetime
) -> None:
    if etag:
        response.etag = etag
    response.last_modified = last_modified


def _get_file_range(request: BaseRequest, node: Node) -> tuple[int, int] | None:
    """
    Converts the Range header to a [start, stop) range of the file.
    Returns None if the whole file should be served instead.
    https://www.rfc-editor.org/rfc/rfc9110#section-14.2
    """
    assert node.size is not None

    if hdrs.RANGE not in request.headers:
        return None
    if not _is_if_range_matched(request, node):
        return None

    try:
        range_ = request.http_range
    except ValueError:
        # Invalid, multiple or unknown unit ranges, which we MAY ignore.
        return None

    size = node.size
    start: int = range_.start
    stop = range_.stop
    if start < 0:
        # suffix-range: the last N bytes
        start = max(size + start, 0)
        stop = size
    elif stop is None or stop > size:
        # last-pos absent or beyond the end means the remainder
        stop = size

    if start >= size:
        raise HTTPRequestRangeNotSatisfiable(
            headers={
                "Accept-Ranges": "bytes",
                "Content-Range": f"bytes */{size}",
            }
        )
    return start, stop


def _is_if_range_matched(request: BaseRequest, node: Node) -> bool:
    """
    The validator must match strongly, so a weak entity-tag never matches.
    https://www.rfc-editor.org/rfc/rfc9110#section-13.1.5
    """
    value = request.headers.get(hdrs.IF_RANGE)
    if value is None:
        return True
    if value.startswith(("W/", '"')):
        return bool(node.hash) and value == f'"{node.hash}"'
    if_range = request.if_range
    if if_range is None:
        return False
    return int(if_range.timestamp()) == int(node.modified_time.timestamp())
