import re
from asyncio import Condition, create_subprocess_exec
from asyncio.subprocess import PIPE
from contextlib import asynccontextmanager
from itertools import zip_longest
from logging import getLogger
from mimetypes import guess_type
from typing import Self

from wcpan.drive.core.types import Node, Drive

from .image import get_image_size
from .storage import StorageManager, create_storage_manager
from .types import ImageDict


_L = getLogger(__name__)


class UnpackFailedError(Exception):
    pass


@asynccontextmanager
async def create_unpack_engine(drive: Drive, port: int, unpack_path: str):
    async with create_storage_manager() as storage:
        yield UnpackEngine(drive, port, unpack_path, storage)


class UnpackEngine:
    def __init__(
        self, drive: Drive, port: int, unpack_path: str, storage: StorageManager
    ) -> None:
        self._drive = drive
        self._port = port
        self._unpack_path = unpack_path
        self._unpacking: dict[str, Condition] = {}
        self._storage = storage

    async def get_manifest(self, node: Node) -> list[ImageDict]:
        manifest = self._storage.get_cache_or_none(node.id)
        if manifest is not None:
            return manifest

        if node.id in self._unpacking:
            lock = self._unpacking[node.id]
            return await self._wait_for_result(lock, node.id)

        lock = Condition()
        self._unpacking[node.id] = lock
        return await self._unpack(node)

    @property
    def cache(self):
        return self._storage.cache

    def clear_cache(self):
        self._storage.clear_cache()

    async def _unpack(self, node: Node) -> list[ImageDict]:
        lock = self._unpacking[node.id]
        try:
            if node.is_directory:
                manifest = await self._unpack_remote(node)
            else:
                manifest = await self._unpack_local(node.id)
            self._storage.set_cache(node.id, manifest)
            return manifest
        except UnpackFailedError:
            raise
        except Exception as e:
            _L.exception("unpack failed, abort")
            raise UnpackFailedError(str(e)) from e
        finally:
            del self._unpacking[node.id]
            async with lock:
                lock.notify_all()

    async def _wait_for_result(
        self,
        lock: Condition,
        node_id: str,
    ) -> list[ImageDict]:
        async with lock:
            await lock.wait()
        try:
            return self._storage.get_cache(node_id)
        except KeyError:
            raise UnpackFailedError(f"{node_id} canceled unpack")

    async def _unpack_local(self, node_id: str) -> list[ImageDict]:
        cmd = [
            self._unpack_path,
            str(self._port),
            node_id,
            str(self._storage.root_path),
        ]

        _L.debug(" ".join(cmd))

        p = await create_subprocess_exec(
            *cmd,
            stdout=PIPE,
            stderr=PIPE,
        )
        _out, err = await p.communicate()
        if p.returncode != 0:
            raise UnpackFailedError(
                f'unpack failed code: {p.returncode}\n\n{err.decode("utf-8")}'
            )
        return self._scan_local(node_id)

    def _scan_local(self, node_id: str) -> list[ImageDict]:
        rv: list[ImageDict] = []
        top = self._storage.get_path(node_id)
        for dirpath, dirnames, filenames in top.walk():
            dirnames.sort(key=FuzzyName)
            filenames.sort(key=FuzzyName)
            for filename in filenames:
                path = dirpath / filename
                type_, _encoding = guess_type(path)
                if type_ is None:
                    continue
                if not type_.startswith("image/"):
                    continue
                try:
                    width, height = get_image_size(path)
                except Exception:
                    _L.exception("unknown image")
                    continue
                rv.append(
                    {
                        "id": str(path),
                        "type": type_,
                        "size": path.stat().st_size,
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
        async for _root, folders, files in self._drive.walk(node):
            folders.sort(key=lambda _: FuzzyName(_.name))
            files.sort(key=lambda _: FuzzyName(_.name))
            for f in files:
                if not f.is_image:
                    continue
                assert f.size is not None
                assert f.width is not None
                assert f.height is not None
                type_ = DEFAULT_MIME_TYPE if not f.mime_type else f.mime_type
                rv.append(
                    {
                        "id": f.id,
                        "type": type_,
                        "size": f.size,
                        "width": f.width,
                        "height": f.height,
                    }
                )
        return rv


class FuzzyName:
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
