import asyncio
from logging import getLogger
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
from typing import Self, TypedDict

from PIL import Image
from wcpan.drive.core.drive import Drive
from wcpan.drive.core.types import Node


class ImageDict(TypedDict):
    type: str
    width: int
    height: int
    size: int
    id: str


class UnpackFailedError(Exception):
    def __init__(self, message: str) -> None:
        self._message = message

    def __str__(self) -> str:
        return self._message


class UnpackEngine(object):
    def __init__(self, drive: Drive, port: int, unpack_path: str) -> None:
        super(UnpackEngine, self).__init__()
        # NOTE only takes a reference, not owning
        self._drive = drive
        self._port = port
        self._unpack_path = unpack_path
        self._unpacking: dict[str, asyncio.Condition] = {}
        self._storage: StorageManager | None = None
        self._raii: AsyncExitStack | None = None

    async def __aenter__(self) -> Self:
        async with AsyncExitStack() as stack:
            self._storage = await stack.enter_async_context(StorageManager())
            self._raii = stack.pop_all()
        return self

    async def __aexit__(self, exc, type_, tb):
        assert self._raii is not None
        await self._raii.aclose()
        self._storage = None
        self._raii = None

    async def get_manifest(self, node: Node) -> list[ImageDict]:
        assert self._storage is not None
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
        assert self._storage is not None
        return self._storage.cache

    def clear_cache(self):
        assert self._storage is not None
        self._storage.clear_cache()

    async def _unpack(self, node: Node) -> list[ImageDict]:
        assert self._storage is not None
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
            getLogger(__name__).exception("unpack failed, abort")
            raise UnpackFailedError(str(e)) from e
        finally:
            del self._unpacking[node.id_]
            async with lock:
                lock.notify_all()

    async def _wait_for_result(
        self,
        lock: asyncio.Condition,
        node_id: str,
    ) -> list[ImageDict]:
        assert self._storage is not None
        async with lock:
            await lock.wait()
        try:
            return self._storage.get_cache(node_id)
        except KeyError:
            raise UnpackFailedError(f"{node_id} canceled unpack")

    async def _unpack_local(self, node_id: str) -> list[ImageDict]:
        assert self._storage is not None
        cmd = [
            self._unpack_path,
            str(self._port),
            node_id,
            self._storage.root_path,
        ]

        getLogger(__name__).debug(" ".join(cmd))

        p = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        out, err = await p.communicate()
        if p.returncode != 0:
            raise UnpackFailedError(
                f'unpack failed code: {p.returncode}\n\n{err.decode("utf-8")}'
            )
        return self._scan_local(node_id)

    def _scan_local(self, node_id: str) -> list[ImageDict]:
        assert self._storage is not None
        rv: list[ImageDict] = []
        top = self._storage.get_path(node_id)
        for dirpath, dirnames, filenames in os.walk(top):
            dirnames.sort(key=FuzzyName)
            filenames.sort(key=FuzzyName)
            for filename in filenames:
                path = join_path(dirpath, filename)
                type_, encoding = guess_type(path)
                if type_ is None:
                    continue
                if not type_.startswith("image/"):
                    continue
                try:
                    image = Image.open(path)
                except OSError:
                    getLogger(__name__).exception("unknown image")
                    continue
                width, height = image.size
                rv.append(
                    {
                        "id": path,
                        "type": type_,
                        "size": getsize(path),
                        "width": width,
                        "height": height,
                    }
                )
        return rv

    async def _unpack_remote(self, node: Node) -> list[ImageDict]:
        return await self._scan_remote(node)

    async def _scan_remote(self, node: Node) -> list[ImageDict]:
        DEFAULT_MIME_TYPE = "application/octet-stream"
        rv: list[ImageDict] = []
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
                rv.append(
                    {
                        "id": f.id_,
                        "type": type_,
                        "size": f.size,
                        "width": f.image_width,
                        "height": f.image_height,
                    }
                )
        return rv


class FuzzyName(object):
    def __init__(self, name: str) -> None:
        seg_list = re.findall(r"\d+|\D+", name)
        seg_list = [int(_) if _.isdigit() else _ for _ in seg_list]
        self._seg_list = seg_list

    def __lt__(self, that: Self) -> bool:
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
        self._cache: dict[str, list[ImageDict]] = {}
        self._tmp: str | None = None
        self._path: pathlib.Path | None = None
        self._raii: AsyncExitStack | None = None

    async def __aenter__(self) -> Self:
        async with AsyncExitStack() as stack:
            self._tmp = stack.enter_context(tempfile.TemporaryDirectory())
            assert self._tmp is not None
            self._path = pathlib.Path(self._tmp)
            await stack.enter_async_context(self._watch())
            self._raii = stack.pop_all()
        return self

    async def __aexit__(self, exc_type, exc_value, traceback):
        assert self._raii is not None
        await self._raii.aclose()
        self._path = None
        self._tmp = None
        self._raii = None

    def clear_cache(self):
        assert self._path is not None
        self._cache = {}
        for child in self._path.iterdir():
            shutil.rmtree(str(child))

    def get_cache(self, id_: str) -> list[ImageDict]:
        return self._cache[id_]

    def get_cache_or_none(self, id_: str) -> list[ImageDict] | None:
        return self._cache.get(id_, None)

    def set_cache(self, id_: str, manifest: list[ImageDict]) -> None:
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
            return ""
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
        assert self._path is not None
        DAY = 60 * 60 * 24
        now = time.time()
        for child in self._path.iterdir():
            s = child.stat()
            d = now - s.st_mtime
            getLogger(__name__).debug(f"check {child} ({d})")
            if d > DAY:
                shutil.rmtree(str(child))
                del self._cache[child.name]
                getLogger(__name__).info(f"prune {child} ({d})")

    async def _loop(self):
        while True:
            await asyncio.sleep(60 * 60)
            self._check()


async def get_node(drive: Drive, id_or_root: str) -> Node | None:
    if id_or_root == "root":
        return await drive.get_root_node()
    else:
        return await drive.get_node_by_id(id_or_root)
