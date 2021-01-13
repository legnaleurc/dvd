from __future__ import annotations

import asyncio
import os
import pathlib
import re
import shutil
import tempfile
import time
from contextlib import AsyncExitStack, asynccontextmanager
from itertools import zip_longest
from mimetypes import guess_type
from os.path import getsize, join as join_path
from typing import Dict, List, TypedDict, Union, cast

from PIL import Image
from wcpan.logger import EXCEPTION, DEBUG, INFO
from wcpan.drive.core.drive import Drive
from wcpan.drive.core.types import Node, NodeDict


class ImageDict(TypedDict):
    type: str
    width: int
    height: int
    size: int
    path: str


class SearchNodeDict(NodeDict):
    path: str


class InvalidPatternError(Exception):

    def __init__(self, message: str) -> None:
        self._message = message

    def __str__(self) -> str:
        return self._message


class SearchFailedError(Exception):

    def __init__(self, message: str) -> None:
        self._message = message

    def __str__(self) -> str:
        return self._message


class UnpackFailedError(Exception):

    def __init__(self, message: str) -> None:
        self._message = message

    def __str__(self) -> str:
        return self._message


class SearchEngine(object):

    def __init__(self, drive: Drive) -> None:
        super(SearchEngine, self).__init__()
        # NOTE only takes a reference, not owning
        self._drive = drive
        self._cache: Dict[str, List[SearchNodeDict]] = {}
        self._searching: Dict[str, asyncio.Condition] = {}

    async def get_nodes_by_regex(self, pattern: str) -> List[SearchNodeDict]:
        nodes = self._cache.get(pattern, None)
        if nodes is not None:
            return nodes

        if pattern in self._searching:
            lock = self._searching[pattern]
            return await self._wait_for_result(lock, pattern)

        lock = asyncio.Condition()
        self._searching[pattern] = lock
        return await self._search(pattern)

    async def clear_cache(self) -> None:
        while len(self._searching) > 0:
            pattern, lock = next(iter(self._searching.items()))
            async with lock:
                await lock.wait()
        self._cache = {}

    def drop_value(self, value: str) -> None:
        keys = list(self._cache.keys())
        for k in keys:
            if re.search(k, value, re.I):
                del self._cache[k]

    async def _search(self, pattern: str) -> List[SearchNodeDict]:
        lock = self._searching[pattern]
        try:
            nodes = await self._drive.find_nodes_by_regex(pattern)
            nodes = (_ for _ in nodes if not _.trashed)
            nodes = (self._make_item(_) for _ in nodes)
            nodes = await asyncio.gather(*nodes)
            nodes = sorted(nodes, key=lambda _: (_['path'], _['name']))
            self._cache[pattern] = nodes
            return nodes
        except Exception as e:
            EXCEPTION('engine', e) << 'search failed, abort'
            raise SearchFailedError(str(e))
        finally:
            del self._searching[pattern]
            async with lock:
                lock.notify_all()

    async def _wait_for_result(self,
        lock: asyncio.Condition,
        pattern: str,
    ) -> List[SearchNodeDict]:
        async with lock:
            await lock.wait()
        try:
            return self._cache[pattern]
        except KeyError:
            raise SearchFailedError(f'{pattern} canceled search')

    async def _make_item(self, node: Node) -> SearchNodeDict:
        parent_node = await self._drive.get_node_by_id(node.parent_id)
        parent_path = await self._drive.get_path(parent_node)
        rv = cast(SearchNodeDict, node.to_dict())
        rv['path'] = str(parent_path)
        return rv


class UnpackEngine(object):

    def __init__(self, drive: Drive, port: int, unpack_path: str) -> None:
        super(UnpackEngine, self).__init__()
        # NOTE only takes a reference, not owning
        self._drive = drive
        self._port = port
        self._unpack_path = unpack_path
        self._unpacking: Dict[str, asyncio.Condition] = {}
        self._storage: Union[StorageManager, None] = None
        self._raii: Union[AsyncExitStack, None] = None

    async def __aenter__(self) -> UnpackEngine:
        async with AsyncExitStack() as stack:
            self._storage = await stack.enter_async_context(
                StorageManager()
            )
            self._raii = stack.pop_all()
        return self

    async def __aexit__(self, exc, type_, tb):
        await self._raii.aclose()
        self._storage = None
        self._raii = None

    async def get_manifest(self, node: Node) -> List[ImageDict]:
        manifest = self._storage.get_cache_or_none(node.id_)
        if manifest is not None:
            return manifest

        if node.id_ in self._unpacking:
            lock = self._unpacking[node.id_]
            return await self._wait_for_result(lock, node.id_)

        lock = asyncio.Condition()
        self._unpacking[node.id_] = lock
        return await self._unpack(node)

    @property
    def cache(self):
        return self._storage.cache

    def clear_cache(self):
        self._storage.clear_cache()

    async def _unpack(self, node: Node) -> List[ImageDict]:
        lock = self._unpacking[node.id_]
        try:
            if node.is_folder:
                manifest = await self._unpack_remote(node)
            else:
                manifest = await self._unpack_local(node.id_)
            self._storage.set_cache(node.id_, manifest)
            return manifest
        except UnpackFailedError:
            raise
        except Exception as e:
            EXCEPTION('engine', e) << 'unpack failed, abort'
            raise UnpackFailedError(str(e))
        finally:
            del self._unpacking[node.id_]
            async with lock:
                lock.notify_all()

    async def _wait_for_result(self,
        lock: asyncio.Condition,
        node_id: str,
    ) -> List[ImageDict]:
        async with lock:
            await lock.wait()
        try:
            return self._storage.get_cache(node_id)
        except KeyError:
            raise UnpackFailedError(f'{node_id} canceled unpack')

    async def _unpack_local(self, node_id: str) -> List[ImageDict]:
        cmd = [
            self._unpack_path,
            str(self._port),
            node_id,
            self._storage.root_path,
        ]
        DEBUG('engine') << ' '.join(cmd)
        p = await asyncio.create_subprocess_exec(*cmd)
        out, err = await p.communicate()
        if p.returncode != 0:
            raise UnpackFailedError(f'unpack failed code: {p.returncode}')
        return self._scan_local(node_id)

    def _scan_local(self, node_id: str) -> List[ImageDict]:
        rv: List[ImageDict] = []
        top = self._storage.get_path(node_id)
        for dirpath, dirnames, filenames in os.walk(top):
            dirnames.sort(key=FuzzyName)
            filenames.sort(key=FuzzyName)
            for filename in filenames:
                path = join_path(dirpath, filename)
                type_, encoding = guess_type(path)
                if type_ is None:
                    continue
                if not type_.startswith('image/'):
                    continue
                try:
                    image = Image.open(path)
                except OSError as e:
                    EXCEPTION('engine', e) << 'unknown image'
                    continue
                width, height = image.size
                rv.append({
                    'path': path,
                    'type': type_,
                    'size': getsize(path),
                    'width': width,
                    'height': height,
                })
        return rv

    async def _unpack_remote(self, node: Node) -> List[ImageDict]:
        return await self._scan_remote(node)

    async def _scan_remote(self, node: Node) -> List[ImageDict]:
        DEFAULT_MIME_TYPE = 'application/octet-stream'
        rv: List[ImageDict] = []
        async for root, folders, files in self._drive.walk(node):
            folders.sort(key=lambda _: FuzzyName(_.name))
            files.sort(key=lambda _: FuzzyName(_.name))
            for f in files:
                if not f.is_image:
                    continue
                assert f.size is not None
                assert f.image_width is not None
                assert f.image_height is not None
                type_ = DEFAULT_MIME_TYPE if f.mime_type is None else f.mime_type
                rv.append({
                    'path': f.id_,
                    'type': type_,
                    'size': f.size,
                    'width': f.image_width,
                    'height': f.image_height,
                })
        return rv


class FuzzyName(object):

    def __init__(self, name: str) -> None:
        seg_list = re.findall(r'\d+|\D+', name)
        seg_list = [int(_) if _.isdigit() else _ for _ in seg_list]
        self._seg_list = seg_list

    def __lt__(self, that: FuzzyName) -> bool:
        for l, r in zip_longest(self._seg_list, that._seg_list):
            # compare length: shorter first
            if l is None:
                return True
            if r is None:
                return False

            # compare type: number first
            if type(l) != type(r):
                return not isinstance(l, int)

            # compare value: lower first
            if l != r:
                return l < r
        return False


class StorageManager(object):

    def __init__(self):
        self._cache: Dict[str, List[ImageDict]] = {}
        self._tmp: Union[str, None] = None
        self._path: Union[pathlib.Path, None] = None
        self._raii: Union[AsyncExitStack, None] = None

    async def __aenter__(self) -> StorageManager:
        async with AsyncExitStack() as stack:
            self._tmp = stack.enter_context(tempfile.TemporaryDirectory())
            assert self._tmp is not None
            self._path = pathlib.Path(self._tmp)
            await stack.enter_async_context(self._watch())
            self._raii = stack.pop_all()
        return self

    async def __aexit__(self, et, e, bt):
        await self._raii.aclose()
        self._path = None
        self._tmp = None
        self._raii = None

    def clear_cache(self):
        self._cache = {}
        for child in self._path.iterdir():
            shutil.rmtree(str(child))

    def get_cache(self, id_: str) -> List[ImageDict]:
        return self._cache[id_]

    def get_cache_or_none(self, id_: str) -> Union[List[ImageDict], None]:
        return self._cache.get(id_, None)

    def set_cache(self, id_: str, manifest: List[ImageDict]) -> None:
        self._cache[id_] = manifest

    def get_path(self, id_: str) -> str:
        assert self._tmp is not None
        return join_path(self._tmp, id_)

    @property
    def cache(self):
        return self._cache

    @property
    def root_path(self) -> str:
        if not self._tmp:
            return ''
        return self._tmp

    @asynccontextmanager
    async def _watch(self):
        task = asyncio.create_task(self._loop())
        try:
            yield
        finally:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                task = None

    def _check(self):
        DAY = 60 * 60 * 24
        now = time.time()
        for child in self._path.iterdir():
            s = child.stat()
            d = now - s.st_mtime
            DEBUG('engine') << 'check' << child << f'({d})'
            if d > DAY:
                shutil.rmtree(str(child))
                del self._cache[child.name]
                INFO('engine') << 'prune' << child << f'({d})'

    async def _loop(self):
        while True:
            await asyncio.sleep(60 * 60)
            self._check()


def normalize_search_pattern(raw: str) -> str:
    rv = re.match(r'(.+?)\s*\((.+)\)', raw)
    if rv:
        rv = rv.groups()
    else:
        rv = (raw,)
    rv = map(inner_normalize_search_pattern, rv)
    rv = '|'.join(rv)
    rv = f'.*({rv}).*'
    return rv


def inner_normalize_search_pattern(raw: str) -> str:
    rv = re.split(r'(?:\s|-)+', raw)
    rv = map(re.escape, rv)
    rv = map(str, rv)
    rv = '.*'.join(rv)
    return rv
