import json
import shlex
from asyncio import as_completed, create_subprocess_exec
from collections.abc import Callable, Iterable
from functools import partial
from logging import getLogger
from pathlib import PurePath
from typing import Any

from aiohttp.web import StreamResponse, View
from aiohttp.web_exceptions import (
    HTTPBadRequest,
    HTTPConflict,
    HTTPInternalServerError,
    HTTPNoContent,
    HTTPNotFound,
    HTTPServiceUnavailable,
    HTTPUnauthorized,
)
from multidict import MultiMapping
from wcpan.drive.core.lib import dispatch_change
from wcpan.drive.core.types import ChangeAction, Node

from .app import KEY_DRIVE, KEY_SEARCH_ENGINE, KEY_UNPACK_ENGINE
from .lib import NodeDict, dict_from_change, dict_from_node, get_node, json_decoder_hook
from .mixins import HasTokenMixin, NodeObjectMixin, NodeRandomAccessMixin
from .rest import (
    CreateAPIMixin,
    DestroyAPIMixin,
    ListAPIMixin,
    PartialUpdateAPIMixin,
    RetriveAPIMixin,
    json_response,
)
from .search import (
    InvalidPatternError,
    SearchEngine,
    SearchFailedError,
    SearchNodeDict,
)
from .types import ImageListCacheDict, ImageSizeDict, VideoSizeDict
from .unpack import UnpackFailedError


_L = getLogger(__name__)


class NodeView(
    NodeObjectMixin,
    HasTokenMixin,
    RetriveAPIMixin[NodeDict],
    PartialUpdateAPIMixin,
    DestroyAPIMixin,
    View,
):
    async def retrive(self):
        node = await self.get_object()
        return dict_from_node(node)

    async def partial_update(self):
        node = await self.get_object()
        drive = self.request.app[KEY_DRIVE]
        kwargs = await self.request.json()
        kwargs = unpack_dict(
            kwargs,
            (
                "parent_id",
                "parent_path",
                "name",
            ),
        )
        if kwargs:
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
            await drive.move(node, new_parent=parent_node, new_name=name)
        raise HTTPNoContent()

    async def destory(self):
        node = await self.get_object()
        _L.info(f"trash {node.id} {node.name}")
        drive = self.request.app[KEY_DRIVE]
        se = self.request.app[KEY_SEARCH_ENGINE]
        se.invalidate_cache_by_node(node)
        await drive.move(node, trashed=True)


class NodeListView(
    HasTokenMixin, ListAPIMixin[SearchNodeDict], CreateAPIMixin[NodeDict], View
):
    async def list_(self):
        # node name
        name = get_query_value(self.request.query, str, "name")
        # fuzzy match name
        fuzzy = get_query_value(self.request.query, bool, "fuzzy")
        # node parent path
        parent_path = get_query_value(self.request.query, str, "parent_path")
        # node size
        size = get_query_value(self.request.query, int, "size")

        se = self.request.app[KEY_SEARCH_ENGINE]
        try:
            nodes = await se(name=name, fuzzy=fuzzy, parent_path=parent_path, size=size)
        except InvalidPatternError:
            _L.exception(f"invalid pattern: {name}")
            raise HTTPBadRequest()
        except SearchFailedError:
            _L.exception(f"search failed")
            raise HTTPServiceUnavailable()
        except Exception:
            _L.exception(f"unexpected error")
            raise HTTPServiceUnavailable()
        return nodes

    async def create(self):
        kwargs = await self.request.json()
        kwargs = unpack_dict(
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


class NodeChildrenView(NodeObjectMixin, HasTokenMixin, ListAPIMixin[NodeDict], View):
    async def list_(self):
        node = await self.get_object()
        drive = self.request.app[KEY_DRIVE]
        children = await drive.get_children(node)
        children = filter(lambda _: not _.is_trashed, children)
        children = [dict_from_node(_) for _ in children]
        return children


class NodeStreamView(NodeObjectMixin, NodeRandomAccessMixin, View):
    async def head(self):
        node = await self.get_object()
        if node.is_directory:
            raise HTTPBadRequest()

        response = await self.create_response()
        await self.setup_headers(response, node)
        await response.prepare(self.request)
        return response

    async def get(self):
        node = await self.get_object()
        if node.is_directory:
            raise HTTPBadRequest()

        response = await self.create_response()
        good_range = await self.setup_headers(response, node)
        await self.feed(response, node, good_range)
        return response


class NodeDownloadView(NodeObjectMixin, NodeRandomAccessMixin, View):
    async def get(self):
        node = await self.get_object()
        if node.is_directory:
            raise HTTPBadRequest()

        response = await self.create_response()
        good_range = await self.setup_headers(response, node)
        response.headers["Content-Disposition"] = f'attachment; filename="{node.name}"'
        await self.feed(response, node, good_range)
        return response


class NodeImageListView(
    NodeObjectMixin, HasTokenMixin, ListAPIMixin[ImageSizeDict], View
):
    async def list_(self) -> list[ImageSizeDict]:
        node = await self.get_object()

        ue = self.request.app[KEY_UNPACK_ENGINE]
        try:
            manifest = await ue.get_manifest(node)
        except UnpackFailedError as e:
            raise HTTPServiceUnavailable(
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


class NodeImageView(NodeObjectMixin, View):
    async def get(self):
        image_id = self.request.match_info.get("image_id", None)
        if not image_id:
            raise HTTPBadRequest()
        image_id = int(image_id)

        node = await self.get_object()
        ue = self.request.app[KEY_UNPACK_ENGINE]
        try:
            manifest = await ue.get_manifest(node)
        except UnpackFailedError:
            raise HTTPInternalServerError()

        try:
            data = manifest[image_id]
        except IndexError:
            raise HTTPNotFound()

        drive = self.request.app[KEY_DRIVE]
        response = StreamResponse(status=200)
        response.content_type = data["type"]
        response.content_length = data["size"]

        await response.prepare(self.request)
        if node.is_directory:
            child = await get_node(drive, data["id"])
            if not child:
                _L.error(f"tried to find child {data['id']} but not found")
                raise HTTPInternalServerError()
            async with drive.download_file(child) as stream:
                async for chunk in stream:
                    await response.write(chunk)
        else:
            with open(data["id"], "rb") as fin:
                while True:
                    chunk = fin.read(65536)
                    if not chunk:
                        break
                    await response.write(chunk)
        return response


class NodeVideoListView(
    NodeObjectMixin, HasTokenMixin, ListAPIMixin[VideoSizeDict], View
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


class ChangesView(HasTokenMixin, View):
    async def post(self):
        if not await self.has_permission():
            raise HTTPUnauthorized()

        drive = self.request.app[KEY_DRIVE]
        se = self.request.app[KEY_SEARCH_ENGINE]
        cache_invalidation = (
            invalidate_cache_by_change(se, _) async for _ in drive.sync()
        )
        changes = [dict_from_change(_) async for _ in cache_invalidation]
        return json_response(changes)


class ApplyView(HasTokenMixin, View):
    async def post(self):
        if not await self.has_permission():
            raise HTTPUnauthorized()

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
    HasTokenMixin, ListAPIMixin[ImageListCacheDict], DestroyAPIMixin, View
):
    async def list_(self) -> list[ImageListCacheDict]:
        ue = self.request.app[KEY_UNPACK_ENGINE]
        drive = self.request.app[KEY_DRIVE]
        cache = ue.cache
        node_list = as_completed(drive.get_node_by_id(_) for _ in cache.keys())
        node_list = [await _ for _ in node_list]
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

    async def destory(self):
        ue = self.request.app[KEY_UNPACK_ENGINE]
        ue.clear_cache()


class CachesSearchesView(HasTokenMixin, View):
    async def post(self):
        if not await self.has_permission():
            raise HTTPUnauthorized()

        parser = partial(json.loads, object_hook=json_decoder_hook)
        nodes: list[Node] = await self.request.json(loads=parser)

        se = self.request.app[KEY_SEARCH_ENGINE]
        for node in nodes:
            se.invalidate_cache_by_node(node)
        raise HTTPNoContent()


class HistoryView(HasTokenMixin, ListAPIMixin[dict[str, Any]], View):
    async def list_(self) -> list[dict[str, Any]]:
        se = self.request.app[KEY_SEARCH_ENGINE]
        history = [_.to_dict() for _ in se.history]
        return history


def unpack_dict(d: dict[str, Any], keys: Iterable[str]) -> dict[str, Any]:
    common_keys = set(keys) & set(d.keys())
    return {key: d[key] for key in common_keys}


type CastFunction[T] = Callable[[Any], T]


def get_query_value[T](
    query: MultiMapping[str], fn: CastFunction[T], key: str
) -> T | None:
    value = query.get(key, None)
    if value is None:
        return None
    return fn(value)


def invalidate_cache_by_change(
    engine: SearchEngine, change: ChangeAction
) -> ChangeAction:
    dispatch_change(
        change,
        on_remove=lambda _: None,
        on_update=lambda node: engine.invalidate_cache_by_node(node),
    )
    return change
