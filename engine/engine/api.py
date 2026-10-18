import json
import shlex
from asyncio import create_subprocess_exec, gather
from collections.abc import AsyncGenerator, Callable, Iterable
from contextlib import asynccontextmanager
from functools import partial
from logging import getLogger
from pathlib import PurePath
from typing import Any

from aiohttp.web import StreamResponse, View
from aiohttp.web_exceptions import (
    HTTPBadGateway,
    HTTPBadRequest,
    HTTPConflict,
    HTTPInternalServerError,
    HTTPNoContent,
    HTTPNotFound,
)
from multidict import MultiMapping
from wcpan.drive.core.lib import dispatch_change
from wcpan.drive.core.types import ChangeAction, Drive, Node, ReadableFile

from .app import KEY_DRIVE, KEY_SEARCH_ENGINE, KEY_UNPACK_ENGINE
from .lib import (
    DownloadFailedError,
    NodeDict,
    content_metadata_from_image,
    content_metadata_from_node,
    dict_from_change,
    dict_from_node,
    get_node,
    json_decoder_hook,
    open_download,
)
from .mixins import NodeObjectMixin, RequireTokenMixin
from .rest import (
    ContentAPIMixin,
    ContentMetadata,
    CreateAPIMixin,
    DestroyAPIMixin,
    ListAPIMixin,
    PartialUpdateAPIMixin,
    RetrieveAPIMixin,
    json_response,
)
from .search import (
    InvalidPatternError,
    SearchEngine,
    SearchFailedError,
    SearchNodeDict,
)
from .types import ImageDict, ImageListCacheDict, ImageSizeDict, VideoSizeDict
from .unpack import UnpackFailedError


_L = getLogger(__name__)


class NodeView(
    NodeObjectMixin,
    RequireTokenMixin,
    RetrieveAPIMixin[NodeDict],
    PartialUpdateAPIMixin[NodeDict],
    DestroyAPIMixin,
    View,
):
    async def retrieve(self):
        node = await self.get_object()
        return dict_from_node(node)

    async def partial_update(self):
        node = await self.get_object()
        drive = self.request.app[KEY_DRIVE]
        kwargs = await self.request.json()
        kwargs = _unpack_dict(
            kwargs,
            (
                "parent_id",
                "parent_path",
                "name",
            ),
        )
        if not kwargs:
            return dict_from_node(node)

        parent_node = None
        name = None
        if "parent_id" in kwargs and "parent_path" in kwargs:
            raise HTTPBadRequest()
        if "parent_id" in kwargs:
            parent_node = await drive.get_node_by_id(kwargs["parent_id"])
        if "parent_path" in kwargs:
            parent_path = PurePath(kwargs["parent_path"])
            parent_node = await drive.get_node_by_path(parent_path)
        if "name" in kwargs:
            name = kwargs["name"]
        node = await drive.move(node, new_parent=parent_node, new_name=name)
        return dict_from_node(node)

    async def destroy(self):
        node = await self.get_object()
        _L.info(f"trash {node.id} {node.name}")
        drive = self.request.app[KEY_DRIVE]
        se = self.request.app[KEY_SEARCH_ENGINE]
        se.invalidate_cache_by_node(node)
        await drive.delete(node)


class NodeListView(
    RequireTokenMixin, ListAPIMixin[SearchNodeDict], CreateAPIMixin[NodeDict], View
):
    async def list_(self):
        # node name
        name = _get_query_value(self.request.query, str, "name")
        # fuzzy match name
        fuzzy = _get_query_value(self.request.query, bool, "fuzzy")
        # node parent path
        parent_path = _get_query_value(self.request.query, str, "parent_path")
        # node size
        size = _get_query_value(self.request.query, int, "size")

        se = self.request.app[KEY_SEARCH_ENGINE]
        try:
            nodes = await se(name=name, fuzzy=fuzzy, parent_path=parent_path, size=size)
        except InvalidPatternError:
            _L.exception(f"invalid pattern: {name}")
            raise HTTPBadRequest()
        except SearchFailedError:
            _L.exception(f"search failed")
            raise HTTPInternalServerError()
        except Exception:
            _L.exception(f"unexpected error")
            raise HTTPInternalServerError()
        return nodes

    async def create(self):
        kwargs = await self.request.json()
        kwargs = _unpack_dict(
            kwargs,
            (
                "parent_id",
                "name",
            ),
        )
        ok = all(
            (
                k in kwargs
                for k in (
                    "parent_id",
                    "name",
                )
            )
        )
        if not ok:
            raise HTTPBadRequest()

        drive = self.request.app[KEY_DRIVE]
        parent_id = kwargs["parent_id"]
        name = kwargs["name"]
        parent = await drive.get_node_by_id(parent_id)
        if not parent:
            raise HTTPBadRequest()

        try:
            node = await drive.create_directory(
                name,
                parent,
                exist_ok=False,
            )
            return dict_from_node(node)
        except Exception as e:
            _L.exception(
                f"failed to create folder, name: {name}, parent_id: {parent_id}"
            )
            raise HTTPConflict() from e


class NodeChildrenView(
    NodeObjectMixin, RequireTokenMixin, ListAPIMixin[NodeDict], View
):
    async def list_(self):
        node = await self.get_object()
        drive = self.request.app[KEY_DRIVE]
        children = await drive.get_children(node)
        children = filter(lambda _: not _.is_trashed, children)
        children = [dict_from_node(_) for _ in children]
        return children


class NodeStreamView(NodeObjectMixin, ContentAPIMixin, View):
    async def serve_content(self) -> StreamResponse:
        node = await self.get_object()
        return await self.serve_stream(
            _get_file_metadata(node),
            partial(_open_node, self.request.app[KEY_DRIVE], node),
        )


class NodeDownloadView(NodeObjectMixin, ContentAPIMixin, View):
    async def serve_content(self) -> StreamResponse:
        node = await self.get_object()
        return await self.serve_stream(
            _get_file_metadata(node),
            partial(_open_node, self.request.app[KEY_DRIVE], node),
            headers={"Content-Disposition": f'attachment; filename="{node.name}"'},
        )


class NodeImageListView(
    NodeObjectMixin, RequireTokenMixin, ListAPIMixin[ImageSizeDict], View
):
    async def list_(self) -> list[ImageSizeDict]:
        node = await self.get_object()

        # Parse and validate max_size parameter
        max_size = _get_query_value(self.request.query, int, "max_size")
        if max_size is None:
            max_size = 0
        if max_size < 0:
            raise HTTPBadRequest(text="max_size must be >= 0")

        ue = self.request.app[KEY_UNPACK_ENGINE]
        try:
            manifest = await ue.get_manifest(node, max_size)
        except UnpackFailedError as e:
            _L.exception(f"failed to get image list from node {node.id}")
            raise HTTPInternalServerError(
                text=json.dumps(
                    {
                        "type": "UnpackFailedError",
                        "message": str(e),
                    }
                )
            )

        return [
            {
                "width": _["width"],
                "height": _["height"],
            }
            for _ in manifest
        ]


class NodeImageView(NodeObjectMixin, ContentAPIMixin, View):
    async def serve_content(self) -> StreamResponse:
        image_id = self._get_image_id()
        max_size = self._get_max_size()
        node = await self.get_object()
        manifest = await self._get_manifest(node)
        data = self._get_manifest_item(manifest, image_id)

        if node.is_directory:
            return await self._get_directory_image(data)
        return await self._get_archive_image(node, image_id, data, max_size)

    def _get_image_id(self) -> int:
        image_id = self.request.match_info.get("image_id")
        if not image_id:
            raise HTTPBadRequest()
        try:
            return int(image_id)
        except Exception as e:
            raise HTTPBadRequest(text="invalid image_id") from e

    def _get_max_size(self) -> int:
        max_size = _get_query_value(self.request.query, int, "max_size")
        if max_size is None:
            max_size = 0
        if max_size < 0:
            raise HTTPBadRequest(text="max_size must be >= 0")
        return max_size

    async def _get_archive_image(
        self, node: Node, image_id: int, data: ImageDict, max_size: int
    ):
        ue = self.request.app[KEY_UNPACK_ENGINE]
        path = await ue.get_local_image_path(node, image_id, data, max_size)
        return self.serve_file(path)

    async def _get_directory_image(self, data: ImageDict) -> StreamResponse:
        return await self.serve_stream(
            content_metadata_from_image(data),
            partial(self._open_directory_image, data),
            headers={"Cache-Control": "private, max-age=86400, immutable"},
        )

    async def _get_manifest(self, node: Node) -> list[ImageDict]:
        ue = self.request.app[KEY_UNPACK_ENGINE]
        try:
            return await ue.get_manifest(node, 0)
        except UnpackFailedError:
            _L.exception(f"failed to get image list from node {node.id}")
            raise HTTPInternalServerError()

    def _get_manifest_item(self, manifest: list[ImageDict], image_id: int) -> ImageDict:
        try:
            return manifest[image_id]
        except IndexError:
            raise HTTPNotFound()

    @asynccontextmanager
    async def _open_directory_image(
        self, data: ImageDict, offset: int
    ) -> AsyncGenerator[ReadableFile]:
        drive = self.request.app[KEY_DRIVE]
        child = await get_node(drive, data["id"])
        if not child:
            _L.error(f"tried to find child {data['id']} but not found")
            raise HTTPInternalServerError()

        async with _open_node(drive, child, offset) as stream:
            yield stream


class NodeVideoListView(
    NodeObjectMixin, RequireTokenMixin, ListAPIMixin[VideoSizeDict], View
):
    async def list_(self) -> list[VideoSizeDict]:
        node = await self.get_object()
        drive = self.request.app[KEY_DRIVE]

        if node.is_video:
            if not node.parent_id:
                return []
            path = await drive.resolve_path(node)
            path = path.parent
            return [
                {
                    "id": node.id,
                    "name": node.name,
                    "mime_type": node.mime_type,
                    "width": node.width,
                    "height": node.height,
                    "path": str(path),
                }
            ]

        if not node.is_directory:
            return []

        manifest: list[VideoSizeDict] = []
        async for _root, _folders, files in drive.walk(node):
            path = await drive.resolve_path(_root)
            for f in files:
                if not f.is_video:
                    continue
                manifest.append(
                    {
                        "id": f.id,
                        "name": f.name,
                        "mime_type": f.mime_type,
                        "width": f.width,
                        "height": f.height,
                        "path": str(path),
                    }
                )

        return manifest


class ChangesView(RequireTokenMixin, View):
    async def post(self):
        await self.check_permission()

        drive = self.request.app[KEY_DRIVE]
        se = self.request.app[KEY_SEARCH_ENGINE]
        cache_invalidation = (
            _invalidate_cache_by_change(se, _) async for _ in drive.sync()
        )
        changes = [dict_from_change(_) async for _ in cache_invalidation]
        return json_response(changes)


class ApplyView(RequireTokenMixin, View):
    async def post(self):
        await self.check_permission()

        kwargs = await self.request.json()
        command = kwargs["command"]
        kwargs = kwargs["kwargs"]

        command = shlex.split(command)
        command = [_.format(**kwargs) for _ in command]
        p = await create_subprocess_exec(*command)
        await p.communicate()
        assert p.returncode == 0
        raise HTTPNoContent()


class CachesImagesView(
    RequireTokenMixin, ListAPIMixin[ImageListCacheDict], DestroyAPIMixin, View
):
    async def list_(self) -> list[ImageListCacheDict]:
        ue = self.request.app[KEY_UNPACK_ENGINE]
        drive = self.request.app[KEY_DRIVE]

        # Parse max_size parameter (optional, for filtering)
        max_size = _get_query_value(self.request.query, int, "max_size")
        if max_size is None:
            max_size = 0  # Default to original size
        if max_size < 0:
            raise HTTPBadRequest(text="max_size must be >= 0")

        # Filter cache entries by max_size
        cache = ue.get_cache_by_max_size(max_size)

        # Fetch node info and keep the cache insertion order.
        results = await gather(*(get_node(drive, _) for _ in cache.keys()))
        node_list = [_ for _ in results if _ is not None]

        return [
            {
                "id": _.id,
                "name": _.name,
                "image_list": [
                    {
                        "width": __["width"],
                        "height": __["height"],
                    }
                    for __ in cache[_.id]
                ],
            }
            for _ in node_list
        ]

    async def destroy(self):
        ue = self.request.app[KEY_UNPACK_ENGINE]
        ue.clear_cache()


class CachesSearchesView(RequireTokenMixin, View):
    async def post(self):
        await self.check_permission()

        parser = partial(json.loads, object_hook=json_decoder_hook)
        nodes: list[Node] = await self.request.json(loads=parser)

        se = self.request.app[KEY_SEARCH_ENGINE]
        for node in nodes:
            se.invalidate_cache_by_node(node)
        raise HTTPNoContent()


class HistoryView(RequireTokenMixin, ListAPIMixin[dict[str, Any]], View):
    async def list_(self) -> list[dict[str, Any]]:
        se = self.request.app[KEY_SEARCH_ENGINE]
        history = [_.to_dict() for _ in se.history]
        return history


def _unpack_dict(d: dict[str, Any], keys: Iterable[str]) -> dict[str, Any]:
    common_keys = set(keys) & set(d.keys())
    return {key: d[key] for key in common_keys}


type _CastFunction[T] = Callable[[Any], T]


def _get_query_value[T](
    query: MultiMapping[str], fn: _CastFunction[T], key: str
) -> T | None:
    value = query.get(key, None)
    if value is None:
        return None
    return fn(value)


@asynccontextmanager
async def _open_node(
    drive: Drive, node: Node, offset: int
) -> AsyncGenerator[ReadableFile]:
    try:
        async with open_download(drive, node, offset) as stream:
            yield stream
    except DownloadFailedError:
        raise HTTPBadGateway()


def _get_file_metadata(node: Node) -> ContentMetadata:
    try:
        return content_metadata_from_node(node)
    except IsADirectoryError:
        raise HTTPBadRequest()


def _invalidate_cache_by_change(
    engine: SearchEngine, change: ChangeAction
) -> ChangeAction:
    dispatch_change(
        change,
        on_remove=lambda _: None,
        on_update=lambda node: engine.invalidate_cache_by_node(node),
    )
    return change
