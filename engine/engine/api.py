import json
from logging import getLogger
import shlex
from typing import Any
from pathlib import PurePath
from asyncio import as_completed, create_subprocess_exec
from collections.abc import Callable, Iterable

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
from wcpan.drive.core.types import Drive

from .mixins import NodeObjectMixin, NodeRandomAccessMixin, HasTokenMixin
from .rest import (
    CreateAPIMixin,
    RetriveAPIMixin,
    PartialUpdateAPIMixin,
    DestroyAPIMixin,
    ListAPIMixin,
    json_response,
)
from .search import (
    InvalidPatternError,
    SearchEngine,
    SearchFailedError,
    SearchNodeDict,
)
from .util import (
    NodeDict,
    UnpackEngine,
    UnpackFailedError,
    get_node,
    dict_from_node,
    dict_from_change,
)
from .types import ImageSizeDict, VideoSizeDict, ImageListCacheDict


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
        drive: Drive = self.request.app["drive"]
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
        drive: Drive = self.request.app["drive"]
        se: SearchEngine = self.request.app["se"]
        path = await drive.resolve_path(node)
        se.drop_value(str(path))
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

        se: SearchEngine = self.request.app["se"]
        try:
            nodes = await se(name=name, fuzzy=fuzzy, parent_path=parent_path, size=size)
        except InvalidPatternError:
            raise HTTPBadRequest()
        except SearchFailedError:
            raise HTTPServiceUnavailable()
        except Exception:
            raise HTTPBadRequest()
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

        drive: Drive = self.request.app["drive"]
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
        drive: Drive = self.request.app["drive"]
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

        ue: UnpackEngine = self.request.app["ue"]
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
        ue: UnpackEngine = self.request.app["ue"]
        try:
            manifest = await ue.get_manifest(node)
        except UnpackFailedError:
            raise HTTPInternalServerError()

        try:
            data = manifest[image_id]
        except IndexError:
            raise HTTPNotFound()

        drive: Drive = self.request.app["drive"]
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
        drive: Drive = self.request.app["drive"]

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

        drive: Drive = self.request.app["drive"]
        se: SearchEngine = self.request.app["se"]
        await se.clear_cache()
        changes = [dict_from_change(_) async for _ in drive.sync()]
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
        raise HTTPNoContent


class CacheView(HasTokenMixin, ListAPIMixin[ImageListCacheDict], DestroyAPIMixin, View):
    async def list_(self) -> list[ImageListCacheDict]:
        ue: UnpackEngine = self.request.app["ue"]
        drive: Drive = self.request.app["drive"]
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
        ue: UnpackEngine = self.request.app["ue"]
        ue.clear_cache()


def unpack_dict(d: dict[str, Any], keys: Iterable[str]) -> dict[str, Any]:
    common_keys = set(keys) & set(d.keys())
    return {key: d[key] for key in common_keys}


type CastFunction[T] = Callable[[Any], T]


def get_query_value[
    T
](query: MultiMapping[str], fn: CastFunction[T], key: str) -> T | None:
    value = query.get(key, None)
    if value is None:
        return None
    return fn(value)
