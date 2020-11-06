from __future__ import annotations

import asyncio
import os
import pathlib
import re
import shutil
import tempfile
import time
from contextlib import AsyncExitStack
from itertools import zip_longest
from mimetypes import guess_type
from os.path import getsize, join as join_path
from typing import Dict, List, TypedDict

from PIL import Image
from wcpan.logger import EXCEPTION, DEBUG
from wcpan.drive.core.drive import Drive
from wcpan.drive.core.cache import Node


class ImageDict(TypedDict):
    type: str
    width: int
    height: int
    size: int
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
        self._cache: Dict[str, List[Node]] = {}
        self._searching: Dict[str, asyncio.Condition] = {}

    async def get_nodes_by_regex(self, pattern: str) -> List[Node]:
        nodes = self._cache.get(pattern, None)
        if nodes is not None:
            return nodes

        if pattern in self._searching:
            lock = self._searching[pattern]
            return await self._wait_for_result(lock, pattern)

        lock = asyncio.Condition()
        self._searching[pattern] = lock
        # We cannot directly await this task, because if the request connection
        # resetted (e.g. by timeout), the task will be cancelled, which will
        # interrupt searching. asyncio.shield can protect searching, but cannot
        # prevent cancellation to other requests. So we use a lock here to
        # truely isolate the cancellation.
        asyncio.create_task(self._search(pattern))
        return await self._wait_for_result(lock, pattern)

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

    async def _search(self, pattern: str) -> None:
        lock = self._searching[pattern]
        try:
            nodes = await self._drive.find_nodes_by_regex(pattern)
            nodes = (_ for _ in nodes if not _.trashed)
            nodes = (self._make_item(_) for _ in nodes)
            nodes = list(nodes)
            nodes = await asyncio.gather(*nodes)
            self._cache[pattern] = nodes
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
    ) -> None:
        async with lock:
            await lock.wait()
        try:
            return self._cache[pattern]
        except KeyError:
            raise SearchFailedError(f'{pattern} canceled search')

    async def _make_item(self, node: Node):
        path = await self._drive.get_path(node)
        rv = node.to_dict()
        rv['path'] = str(path)
        return rv


class UnpackEngine(object):

    def __init__(self, drive: Drive, port: int, unpack_path: str) -> None:
        super(UnpackEngine, self).__init__()
        # NOTE only takes a reference, not owning
        self._drive = drive
        self._port = port
        self._unpack_path = unpack_path
        self._cache: Dict[str, List[ImageDict]] = {}
        self._unpacking: Dict[str, asyncio.Condition] = {}
        self._tmp: tempfile.TemporaryDirectory = None
        self._cleaner: UnpackCleaner = None
        self._raii: AsyncExitStack = None

    async def __aenter__(self) -> UnpackEngine:
        async with AsyncExitStack() as stack:
            self._tmp = stack.enter_context(tempfile.TemporaryDirectory())
            self._cleaner = await stack.enter_async_context(
                UnpackCleaner(self._tmp)
            )
            self._raii = stack.pop_all()
        return self

    async def __aexit__(self, exc, type_, tb) -> bool:
        await self._raii.aclose()
        self._cleaner = None
        self._tmp = None
        self._raii = None

    async def get_manifest(self, node: Node):
        manifest = self._cache.get(node.id_, None)
        if manifest is not None:
            return manifest

        if node.id_ in self._unpacking:
            lock = self._unpacking[node.id_]
            return await self._wait_for_result(lock, node.id_)

        lock = asyncio.Condition()
        self._unpacking[node.id_] = lock
        # See the comments in SearchEngine to understand why we need a lock
        # here.
        asyncio.create_task(self._unpack(node))
        return await self._wait_for_result(lock, node.id_)

    async def _unpack(self, node):
        lock = self._unpacking[node.id_]
        try:
            if node.is_folder:
                await self._unpack_remote(node)
            else:
                await self._unpack_local(node.id_)
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
            return self._cache[node_id]
        except KeyError:
            raise UnpackFailedError(f'{node_id} canceled unpack')

    async def _unpack_local(self, node_id: str) -> None:
        cmd = [self._unpack_path, str(self._port), node_id, self._tmp]
        DEBUG('engine') << ' '.join(cmd)
        p = await asyncio.create_subprocess_exec(*cmd)
        out, err = await p.communicate()
        if p.returncode != 0:
            raise UnpackFailedError(f'unpack failed code: {p.returncode}')
        self._cache[node_id] = self._scan_local(node_id)

    def _scan_local(self, node_id: str) -> List[ImageDict]:
        rv: List[ImageDict] = []
        top = join_path(self._tmp, node_id)
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

    async def _unpack_remote(self, node: Node):
        self._cache[node.id_] = await self._scan_remote(node)

    async def _scan_remote(self, node: Node) -> List[ImageDict]:
        rv: List[ImageDict] = []
        async for root, folders, files in self._drive.walk(node):
            folders.sort(key=lambda _: FuzzyName(_.name))
            files.sort(key=lambda _: FuzzyName(_.name))
            for f in files:
                if f.is_image:
                    rv.append({
                        'path': f.id_,
                        'type': f.mime_type,
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


class UnpackCleaner(object):

    def __init__(self, path):
        self._path = pathlib.Path(path)
        self._task: asyncio.Task = None

    async def __aenter__(self):
        self._task = asyncio.create_task(self._loop())

    async def __aexit__(self, et, e, bt):
        self._task.cancel()
        try:
            await self._task
        except asyncio.CancelledError:
            self._task = None
            pass

    def _check(self):
        DAY = 60 * 60 * 24
        now = time.time()
        for child in self._path.iterdir():
            s = child.stat()
            d = now - s.st_mtime
            DEBUG('engine') << 'check' << child << f'({d})'
            if d > DAY:
                shutil.rmtree(str(child))

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
    rv = '.*'.join(rv)
    return rv
