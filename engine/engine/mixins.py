import re

from aiohttp.abc import AbstractView
from aiohttp.web import StreamResponse
from aiohttp.web_exceptions import (
    HTTPBadRequest,
    HTTPNotFound,
    HTTPUnauthorized,
)
from wcpan.drive.core.types import Node

from .app import KEY_DRIVE, KEY_TOKEN
from .lib import get_node
from .rest import PermissionMixin


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
        range_ = self.request.http_range
        if range_.start is None and range_.stop is None:
            return StreamResponse(status=200)
        return StreamResponse(status=206)

    async def setup_headers(
        self,
        response: StreamResponse,
        node: Node,
    ) -> tuple[int, int] | None:
        assert node.size is not None

        DEFAULT_MIME_TYPE = "application/octet-stream"

        range_ = self.request.http_range
        offset = 0 if range_.start is None else range_.start
        stop = node.size if range_.stop is None else range_.stop
        length = stop - offset
        # Not out of range.
        good_range = is_valid_range(range_, node.size)
        # The response needs Content-Range.
        want_range = range_.start is not None or range_.stop is not None

        response.content_type = (
            DEFAULT_MIME_TYPE if not node.mime_type else node.mime_type
        )
        response.content_length = length
        if want_range:
            response.headers["Content-Range"] = f"bytes {offset}-{stop - 1}/{node.size}"
        response.headers["Accept-Ranges"] = "bytes"

        if not good_range:
            response.set_status(416)
            return None

        return offset, length

    async def feed(
        self,
        response: StreamResponse,
        node: Node,
        good_range: tuple[int, int] | None,
    ) -> None:
        await response.prepare(self.request)
        if not good_range:
            return

        offset, length = good_range
        drive = self.request.app[KEY_DRIVE]
        async with drive.download_file(node) as stream:
            await stream.seek(offset)
            async for chunk in stream:
                if len(chunk) < length:
                    try:
                        await response.write(chunk)
                    except ConnectionResetError:
                        # client closed
                        break
                    length -= len(chunk)
                else:
                    chunk = chunk[:length]
                    try:
                        await response.write(chunk)
                    except ConnectionResetError:
                        # client closed
                        break
                    break


class HasTokenMixin(PermissionMixin, AbstractView):
    async def has_permission(self):
        token: str = self.request.app[KEY_TOKEN]
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


def is_valid_range(range_: slice, size: int) -> bool:
    if range_.start is None and range_.stop is None:
        return True
    if range_.start is None:
        return False
    if range_.start < 0:
        return False
    if range_.start >= size:
        return False
    if range_.stop is None:
        return True
    if range_.stop <= 0:
        return False
    if range_.stop > size:
        return False
    return True
