import json
from abc import abstractmethod
from collections.abc import AsyncIterable, Callable, Mapping
from contextlib import AbstractAsyncContextManager
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, NoReturn

from aiohttp import hdrs
from aiohttp.abc import AbstractView
from aiohttp.web import BaseRequest, FileResponse, Response, StreamResponse
from aiohttp.web_exceptions import (
    HTTPNoContent,
    HTTPNotModified,
    HTTPRequestRangeNotSatisfiable,
)


class PermissionMixin(AbstractView):
    async def check_permission(self) -> None:
        if not await self.has_permission():
            await self.raise_permission_error()

    @abstractmethod
    async def has_permission(self) -> bool: ...

    @abstractmethod
    async def raise_permission_error(self) -> NoReturn: ...


class RetrieveAPIMixin[T](PermissionMixin):
    async def get(self) -> Response:
        await self.check_permission()
        rv = await self.retrieve()
        return json_response(rv, status=200)

    @abstractmethod
    async def retrieve(self) -> T: ...


class ListAPIMixin[T](PermissionMixin):
    async def get(self) -> Response:
        await self.check_permission()
        rv = await self.list_()
        return json_response(rv, status=200)

    @abstractmethod
    async def list_(self) -> list[T]: ...


class PartialUpdateAPIMixin[T](PermissionMixin):
    async def patch(self) -> Response:
        await self.check_permission()
        rv = await self.partial_update()
        return json_response(rv, status=200)

    @abstractmethod
    async def partial_update(self) -> T: ...


class CreateAPIMixin[T](PermissionMixin):
    async def post(self) -> Response:
        await self.check_permission()
        rv = await self.create()
        return json_response(rv, status=201)

    @abstractmethod
    async def create(self) -> T: ...


class DestroyAPIMixin(PermissionMixin):
    async def delete(self) -> NoReturn:
        await self.check_permission()
        await self.destroy()
        raise HTTPNoContent()

    @abstractmethod
    async def destroy(self) -> None: ...


def json_response(data: Any, status: int = 200):
    data = json.dumps(data)
    return Response(
        status=status,
        content_type="application/json",
        text=data + "\n",
    )


@dataclass(frozen=True)
class ContentMetadata:
    size: int
    content_type: str
    etag: str
    last_modified: datetime


type ContentOpener = Callable[[int], AbstractAsyncContextManager[AsyncIterable[bytes]]]


class ContentAPIMixin(AbstractView):
    """
    Serves content with conditional and range requests.
    No permission check by design: these URLs are used directly by media
    elements, which cannot send an Authorization header.
    """

    async def get(self) -> StreamResponse:
        return await self.serve_content()

    async def head(self) -> StreamResponse:
        return await self.serve_content()

    @abstractmethod
    async def serve_content(self) -> StreamResponse: ...

    def serve_file(
        self, path: Path, *, headers: Mapping[str, str] | None = None
    ) -> FileResponse:
        """
        The file may be generated (e.g. a scaled image), so let FileResponse
        derive the validators and handle conditional and range requests itself.
        """
        return FileResponse(path, headers=headers)

    async def serve_stream(
        self,
        metadata: ContentMetadata,
        open_content: ContentOpener,
        *,
        headers: Mapping[str, str] | None = None,
    ) -> StreamResponse:
        response = StreamResponse(status=200, headers=headers)
        offset, length = _setup_headers(self.request, response, metadata)
        if self.request.method == hdrs.METH_HEAD or length <= 0:
            await response.prepare(self.request)
            return response

        # Open and seek before committing headers so startup errors can be reported.
        async with open_content(offset) as stream:
            await response.prepare(self.request)
            async for chunk in stream:
                chunk = chunk[:length]
                try:
                    await response.write(chunk)
                except ConnectionResetError:
                    break
                length -= len(chunk)
                if length <= 0:
                    break
        return response


def _is_entity_modified(
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


def _setup_validators(
    response: StreamResponse, *, etag: str, last_modified: datetime
) -> None:
    if etag:
        response.etag = etag
    response.last_modified = last_modified


def _setup_headers(
    request: BaseRequest,
    response: StreamResponse,
    metadata: ContentMetadata,
) -> tuple[int, int]:
    """
    Fills the headers by RFC 9110 and returns the (offset, length) to serve.
    Raises 304 if not modified, or 416 if the range is not satisfiable.
    """
    response.content_type = metadata.content_type or "application/octet-stream"
    if not _is_entity_modified(
        request, etag=metadata.etag, last_modified=metadata.last_modified
    ):
        not_modified = HTTPNotModified(headers=response.headers)
        _setup_validators(
            not_modified, etag=metadata.etag, last_modified=metadata.last_modified
        )
        raise not_modified

    _setup_validators(
        response, etag=metadata.etag, last_modified=metadata.last_modified
    )
    response.headers["Accept-Ranges"] = "bytes"

    range_ = _get_file_range(request, metadata)
    if range_ is None:
        response.content_length = metadata.size
        return 0, metadata.size

    start, stop = range_
    response.set_status(206)
    response.content_length = stop - start
    response.headers["Content-Range"] = f"bytes {start}-{stop - 1}/{metadata.size}"
    return start, stop - start


def _get_file_range(
    request: BaseRequest, metadata: ContentMetadata
) -> tuple[int, int] | None:
    """
    Converts the Range header to a [start, stop) range of the file.
    Returns None if the whole file should be served instead.
    https://www.rfc-editor.org/rfc/rfc9110#section-14.2
    """
    if hdrs.RANGE not in request.headers:
        return None
    if not _is_if_range_matched(request, metadata):
        return None

    try:
        range_ = request.http_range
    except ValueError:
        # Invalid, multiple or unknown unit ranges, which we MAY ignore.
        return None

    size = metadata.size
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


def _is_if_range_matched(request: BaseRequest, metadata: ContentMetadata) -> bool:
    """
    The validator must match strongly, so a weak entity-tag never matches.
    https://www.rfc-editor.org/rfc/rfc9110#section-13.1.5
    """
    value = request.headers.get(hdrs.IF_RANGE)
    if value is None:
        return True
    if value.startswith(("W/", '"')):
        return bool(metadata.etag) and value == f'"{metadata.etag}"'
    if_range = request.if_range
    if if_range is None:
        return False
    return int(if_range.timestamp()) == int(metadata.last_modified.timestamp())
