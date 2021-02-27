from __future__ import annotations

import asyncio
import json
import re
import shlex
from typing import Any, Dict, Iterable

from aiohttp.web import Response, StreamResponse, View
from aiohttp.web_exceptions import (
    HTTPBadRequest,
    HTTPConflict,
    HTTPNoContent,
    HTTPServiceUnavailable,
    HTTPUnauthorized,
)
from wcpan.logger import EXCEPTION
from wcpan.drive.core.drive import Drive

from .mixins import NodeObjectMixin, NodeRandomAccessMixin, HasTokenMixin
from .rest import (
    CreateAPIMixin,
    RetriveAPIMixin,
    PartialUpdateAPIMixin,
    DestroyAPIMixin,
    ListAPIMixin,
    json_response,
)
from .util import (
    InvalidPatternError,
    SearchEngine,
    SearchFailedError,
    UnpackEngine,
    UnpackFailedError,
    normalize_search_pattern,
    get_node,
)


class NodeView(NodeObjectMixin, HasTokenMixin, RetriveAPIMixin, PartialUpdateAPIMixin, DestroyAPIMixin, View):

    async def retrive(self):
        node = await self.get_object()
        return node.to_dict()

    async def partial_update(self):
        node = await self.get_object()
        drive: Drive = self.request.app['drive']
        kwargs = await self.request.json()
        kwargs = unpack_dict(kwargs, (
            'parent_id',
            'name',
        ))
        if kwargs:
            parent_node = None
            name = None
            if 'parent_id' in kwargs:
                parent_node = await drive.get_node_by_id(kwargs['parent_id'])
            if 'name' in kwargs:
                name = kwargs['name']
            await drive.rename_node(node, parent_node, name)
        raise HTTPNoContent()

    async def destory(self):
        node = await self.get_object()
        drive: Drive = self.request.app['drive']
        se: SearchEngine = self.request.app['se']
        path = await drive.get_path(node)
        se.drop_value(str(path))
        await drive.trash_node(node)

    # async def options(self):
    #     return Response(
    #         status=204,
    #         headers={
    #             'Access-Control-Allow-Origin': '*',
    #             'Access-Control-Allow-Methods': ', '.join([
    #                 'GET',
    #                 'DELETE',
    #                 'PATCH',
    #                 'OPTIONS',
    #             ]),
    #         })


class NodeListView(HasTokenMixin, ListAPIMixin, CreateAPIMixin, View):

    async def list_(self):
        name_filter = self.request.query.get('name', None)
        if not name_filter:
            raise HTTPBadRequest()

        se = self.request.app['se']
        try:
            nodes = await search_by_name(se, name_filter)
        except InvalidPatternError:
            raise HTTPBadRequest()
        except SearchFailedError:
            raise HTTPServiceUnavailable()

        return nodes

    async def create(self):
        kwargs = await self.request.json()
        kwargs = unpack_dict(kwargs, (
            'parent_id',
            'name',
        ))
        ok = all((k in kwargs for k in (
            'parent_id',
            'name',
        )))
        if not ok:
            raise HTTPBadRequest()

        drive: Drive = self.request.app['drive']
        parent_id = kwargs['parent_id']
        name = kwargs['name']
        parent = await drive.get_node_by_id(parent_id)
        try:
            node = await drive.create_folder(
                parent_node=parent,
                folder_name=name,
                exist_ok=False,
            )
            return node.to_dict()
        except Exception as e:
            EXCEPTION('engine', e) << name << parent_id
            raise HTTPConflict() from e


class NodeChildrenView(NodeObjectMixin, HasTokenMixin, ListAPIMixin, View):

    async def list_(self):
        node = await self.get_object()
        drive: Drive = self.request.app['drive']
        children = await drive.get_children(node)
        children = filter(lambda _: not _.trashed, children)
        children = [_.to_dict() for _ in children]
        return children


class NodeStreamView(NodeObjectMixin, NodeRandomAccessMixin, HasTokenMixin, View):

    async def head(self):
        if not await self.has_permission():
            raise HTTPUnauthorized()

        node = await self.get_object()
        if node.is_folder:
            raise HTTPBadRequest()

        response = await self.create_response()
        await self.setup_headers(response, node)
        await response.prepare(self.request)
        return response

    async def get(self):
        if not await self.has_permission():
            raise HTTPUnauthorized()

        node = await self.get_object()
        if node.is_folder:
            raise HTTPBadRequest()

        response = await self.create_response()
        good_range = await self.setup_headers(response, node)
        await self.feed(response, node, good_range)
        return response


class NodeDownloadView(NodeObjectMixin, NodeRandomAccessMixin, HasTokenMixin, View):

    async def get(self):
        if not await self.has_permission():
            raise HTTPUnauthorized()

        node = await self.get_object()
        if node.is_folder:
            raise HTTPBadRequest()

        response = await self.create_response()
        good_range = await self.setup_headers(response, node)
        response.headers['Content-Disposition'] = f'attachment; filename="{node.name}"'
        await self.feed(response, node, good_range)
        return response


class NodeImageListView(NodeObjectMixin, HasTokenMixin, ListAPIMixin, View):

    async def list_(self):
        node = await self.get_object()

        ue: UnpackEngine = self.request.app['ue']
        try:
            manifest = await ue.get_manifest(node)
        except UnpackFailedError as e:
            raise HTTPServiceUnavailable(text=json.dumps({
                'type': 'UnpackFailedError',
                'message': str(e),
            }))

        manifest = [{
            'width': _['width'],
            'height': _['height'],
        } for _ in manifest]
        return manifest


class NodeImageView(NodeObjectMixin, HasTokenMixin, View):

    async def get(self):
        if not await self.has_permission():
            raise HTTPUnauthorized()

        image_id = self.request.match_info.get('image_id', None)
        if not image_id:
            raise HTTPBadRequest()
        image_id = int(image_id)

        node = await self.get_object()
        ue: UnpackEngine = self.request.app['ue']
        try:
            manifest = await ue.get_manifest(node)
        except UnpackFailedError:
            return Response(status=503)

        try:
            data = manifest[image_id]
        except IndexError:
            return Response(status=404)

        drive: Drive = self.request.app['drive']
        response = StreamResponse(status=200)
        response.content_type = data['type']
        response.content_length = data['size']

        await response.prepare(self.request)
        if node.is_folder:
            child = await get_node(drive, data['path'])
            async with await drive.download(child) as stream:
                async for chunk in stream:
                    await response.write(chunk)
        else:
            with open(data['path'], 'rb') as fin:
                while True:
                    chunk = fin.read(65536)
                    if not chunk:
                        break
                    await response.write(chunk)
        return response


class ChangesView(HasTokenMixin, View):

    async def post(self):
        if not await self.has_permission():
            raise HTTPUnauthorized()

        drive: Drive = self.request.app['drive']
        se: SearchEngine = self.request.app['se']
        await se.clear_cache()
        changes = [_ async for _ in drive.sync()]
        return json_response(changes)


class ApplyView(HasTokenMixin, View):

    async def post(self):
        if not await self.has_permission():
            raise HTTPUnauthorized()

        kwargs = await self.request.json()
        command = kwargs['command']
        kwargs = kwargs['kwargs']

        command = shlex.split(command)
        command = (_.format(**kwargs) for _ in command)
        command = list(command)
        p = await asyncio.create_subprocess_exec(*command)
        await p.communicate()
        assert p.returncode == 0
        raise HTTPNoContent


class CacheView(HasTokenMixin, ListAPIMixin, DestroyAPIMixin, View):

    async def list_(self):
        ue: UnpackEngine = self.request.app['ue']
        drive: Drive = self.request.app['drive']
        cache = ue.cache
        node_list = (drive.get_node_by_id(_) for _ in cache.keys())
        node_list = await asyncio.gather(*node_list)
        rv = [{
            'id': _.id_,
            'name': _.name,
            'image_list': [{
                'width': __['width'],
                'height': __['height'],
            } for __ in cache[_.id_]],
        } for _ in node_list]
        return rv

    async def destory(self):
        ue: UnpackEngine = self.request.app['ue']
        ue.clear_cache()


async def search_by_name(
    search_engine: SearchEngine,
    pattern: str,
):
    real_pattern = normalize_search_pattern(pattern)
    try:
        re.compile(real_pattern)
    except Exception as e:
        EXCEPTION('engine', e) << real_pattern
        raise InvalidPatternError(real_pattern)

    se = search_engine
    nodes = await se.get_nodes_by_regex(real_pattern)
    return nodes


def unpack_dict(d: Dict[str, Any], keys: Iterable[str]) -> Dict[str, Any]:
    common_keys = set(keys) & set(d.keys())
    return { key: d[key] for key in common_keys }
