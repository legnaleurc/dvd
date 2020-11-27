import asyncio
import functools
import json
import re
import shlex
from typing import Any, Dict, List

from aiohttp.web import Response, StreamResponse, View
from wcpan.logger import EXCEPTION
from wcpan.drive.core.drive import Drive
from wcpan.drive.core.types import Node

from .util import (
    InvalidPatternError,
    SearchEngine,
    SearchFailedError,
    UnpackEngine,
    UnpackFailedError,
    normalize_search_pattern,
)


class NotFoundError(Exception):

    pass


def raise_404(fn):
    @functools.wraps(fn)
    async def wrapper(self):
        try:
            return await fn(self)
        except NotFoundError:
            return Response(status=404)
    return wrapper


class NodeObjectMixin(object):

    async def get_object(self: View):
        id_ = self.request.match_info.get('id', None)
        if not id_:
            raise NotFoundError

        drive = self.request.app['drive']
        node = await get_node(drive, id_)
        if not node:
            raise NotFoundError

        return node


class NodeRandomAccessMixin(object):

    async def create_response(self: View):
        range_ = self.request.http_range
        if range_.start is None and range_.stop is None:
            return StreamResponse(status=200)
        return StreamResponse(status=206)

    async def feed(self: View, response: StreamResponse, node: Node) -> None:
        range_ = self.request.http_range
        offset = 0 if range_.start is None else range_.start
        length = node.size - offset if not range_.stop else range_.stop
        stop = range_.stop if range_.stop else node.size - 1
        # Not out of range.
        good_range = is_valid_range(range_, node.size)
        # The response needs Content-Range.
        want_range = range_.start is not None or range_.stop is not None

        if want_range:
            response.headers['Content-Range'] = f'bytes {offset}-{stop}/{node.size}'

        response.content_length = length

        response.headers['Accept-Ranges'] = 'bytes'
        response.content_type = node.mime_type
        if not good_range:
            response.set_status(416)

        drive = self.request.app['drive']

        await response.prepare(self.request)
        if not good_range:
            return
        async with await drive.download(node) as stream:
            await stream.seek(offset)
            async for chunk in stream:
                await response.write(chunk)


class NodeView(NodeObjectMixin, View):

    @raise_404
    async def get(self):
        node = await self.get_object()
        dict_ = node.to_dict()
        return json_response(dict_)

    @raise_404
    async def patch(self):
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
        return Response(
            status=204,
            headers={
                'Access-Control-Allow-Origin': '*',
            })

    @raise_404
    async def delete(self):
        node = await self.get_object()
        drive: Drive = self.request.app['drive']
        se: SearchEngine = self.request.app['se']
        path = await drive.get_path(node)
        se.drop_value(str(path))
        await drive.trash_node(node)
        return Response(
            status=204,
            headers={
                'Access-Control-Allow-Origin': '*',
            })

    async def options(self):
        return Response(
            status=204,
            headers={
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': ', '.join([
                    'GET',
                    'DELETE',
                    'PATCH',
                    'OPTIONS',
                ]),
            })


class NodeListView(View):

    async def get(self):
        name_filter = self.request.query.get('name', None)
        if not name_filter:
            return Response(status=400)

        se = self.request.app['se']
        try:
            nodes = await search_by_name(se, name_filter)
        except InvalidPatternError:
            return Response(status=400)
        except SearchFailedError:
            return Response(status=503)

        nodes = sorted(nodes, key=lambda _: _['path'])
        return json_response(nodes)

    async def post(self):
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
            return Response(status=400)

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
            return json_response(node.to_dict())
        except Exception as e:
            EXCEPTION('engine', e) << name << parent_id
            return Response(status=409)


class NodeChildrenView(NodeObjectMixin, View):

    @raise_404
    async def get(self):
        node = await self.get_object()
        drive: Drive = self.request.app['drive']
        children = await drive.get_children(node)
        children = filter(lambda _: not _.trashed, children)
        children = [_.to_dict() for _ in children]
        return json_response(children)


class NodeStreamView(NodeObjectMixin, NodeRandomAccessMixin, View):

    @raise_404
    async def get(self):
        node = await self.get_object()
        if node.is_folder:
            return Response(status=400)

        response = await self.create_response()
        await self.feed(response, node)
        return response


class NodeDownloadView(NodeObjectMixin, NodeRandomAccessMixin, View):

    @raise_404
    async def get(self):
        node = await self.get_object()
        if node.is_folder:
            return Response(status=400)

        response = await self.create_response()
        response.headers['Content-Disposition'] = f'attachment; filename="{node.name}"'
        await self.feed(response, node)
        return response


class NodeImageListView(NodeObjectMixin, View):

    @raise_404
    async def get(self):
        node = await self.get_object()

        ue: UnpackEngine = self.request.app['ue']
        try:
            manifest = await ue.get_manifest(node)
        except UnpackFailedError:
            return Response(status=503)

        manifest = [{
            'width': _['width'],
            'height': _['height'],
        } for _ in manifest]
        return json_response(manifest)


class NodeImageView(NodeObjectMixin, View):

    @raise_404
    async def get(self):
        node = await self.get_object()

        image_id = self.request.match_info.get('image_id', None)
        if not image_id:
            return Response(status=404)
        image_id = int(image_id)

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


class ChangesView(View):

    async def post(self):
        drive: Drive = self.request.app['drive']
        se: SearchEngine = self.request.app['se']
        await se.clear_cache()
        changes = [_ async for _ in drive.sync()]
        return json_response(changes)


class ApplyView(View):

    async def post(self):
        kwargs = await self.request.json()
        command = kwargs['command']
        kwargs = kwargs['kwargs']

        command = shlex.split(command)
        command = (_.format(**kwargs) for _ in command)
        command = list(command)
        p = await asyncio.create_subprocess_exec(*command)
        await p.communicate()
        assert p.returncode == 0
        return Response(status=204)


def json_response(data):
    data = json.dumps(data)
    return Response(
        content_type='application/json',
        text=data + '\n',
        headers={
            'Access-Control-Allow-Origin': '*',
        })


async def get_node(drive: Drive, id_or_root: str) -> Node:
    if id_or_root == 'root':
        return await drive.get_root_node()
    else:
        return await drive.get_node_by_id(id_or_root)


async def search_by_name(
    search_engine: SearchEngine,
    pattern: str,
) -> List[Node]:
    real_pattern = normalize_search_pattern(pattern)
    try:
        re.compile(real_pattern)
    except Exception as e:
        EXCEPTION('engine', e) << real_pattern
        raise InvalidPatternError(real_pattern)

    se = search_engine
    nodes = await se.get_nodes_by_regex(real_pattern)
    return nodes


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


def unpack_dict(d: Dict[str, Any], keys: List[str]) -> Dict[str, Any]:
    common_keys = set(keys) & set(d.keys())
    return { key: d[key] for key in common_keys }
