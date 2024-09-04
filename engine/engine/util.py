import asyncio
from logging import getLogger
import re
import shutil
import time
from contextlib import AsyncExitStack, asynccontextmanager
from itertools import zip_longest
from mimetypes import guess_type
from typing import Self, TypedDict
from tempfile import TemporaryDirectory
from pathlib import Path
from asyncio import Condition

from PIL import Image
from wcpan.drive.core.types import Node, Drive, ChangeAction
from wcpan.drive.core.exceptions import NodeNotFoundError
from wcpan.drive.core.lib import dispatch_change
import pillow_avif as pillow_avif  # type: ignore


_L = getLogger(__name__)


# relax decompression bomb check
if Image.MAX_IMAGE_PIXELS is not None:
    Image.MAX_IMAGE_PIXELS = Image.MAX_IMAGE_PIXELS * 2


class NodeDict(TypedDict):
    id: str
    name: str
    parent_id: str | None
    is_trashed: bool
    is_directory: bool
    mtime: str
    mime_type: str
    hash: str
    size: int


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


@asynccontextmanager
async def create_storage_manager():
    async with AsyncExitStack() as stack:
        tmp = stack.enter_context(TemporaryDirectory())
        path = Path(tmp)
        storage = StorageManager(path)
        await stack.enter_async_context(storage.watch())
        yield storage


class StorageManager(object):
    def __init__(self, path: Path):
        self._cache: dict[str, list[ImageDict]] = {}
        self._path = path

    def clear_cache(self):
        self._cache = {}
        for child in self._path.iterdir():
            shutil.rmtree(str(child))

    def get_cache(self, id_: str) -> list[ImageDict]:
        return self._cache[id_]

    def get_cache_or_none(self, id_: str) -> list[ImageDict] | None:
        return self._cache.get(id_, None)

    def set_cache(self, id_: str, manifest: list[ImageDict]) -> None:
        self._cache[id_] = manifest

    def get_path(self, id_: str) -> Path:
        return self._path / id_

    @property
    def cache(self):
        return self._cache

    @property
    def root_path(self) -> Path:
        return self._path

    @asynccontextmanager
    async def watch(self):
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
            _L.debug(f"check {child} ({d})")
            if d > DAY:
                shutil.rmtree(str(child))
                del self._cache[child.name]
                _L.info(f"prune {child} ({d})")

    async def _loop(self):
        while True:
            await asyncio.sleep(60 * 60)
            self._check()


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
        assert self._storage is not None
        return self._storage.cache

    def clear_cache(self):
        assert self._storage is not None
        self._storage.clear_cache()

    async def _unpack(self, node: Node) -> list[ImageDict]:
        assert self._storage is not None
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
            str(self._storage.root_path),
        ]

        _L.debug(" ".join(cmd))

        p = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        _out, err = await p.communicate()
        if p.returncode != 0:
            raise UnpackFailedError(
                f'unpack failed code: {p.returncode}\n\n{err.decode("utf-8")}'
            )
        return self._scan_local(node_id)

    def _scan_local(self, node_id: str) -> list[ImageDict]:
        assert self._storage is not None
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
                    image = Image.open(path)  # type: ignore
                except OSError:
                    _L.exception("unknown image")
                    continue
                width, height = image.size
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


async def get_node(drive: Drive, id_or_root: str) -> Node | None:
    try:
        if id_or_root == "root":
            return await drive.get_root()
        else:
            return await drive.get_node_by_id(id_or_root)
    except NodeNotFoundError:
        return None


def dict_from_node(node: Node) -> NodeDict:
    return {
        "id": node.id,
        "name": node.name,
        "parent_id": node.parent_id,
        "is_trashed": node.is_trashed,
        "is_directory": node.is_directory,
        "mtime": node.mtime.isoformat(),
        "mime_type": node.mime_type,
        "hash": node.hash,
        "size": node.size,
    }


def dict_from_change(change: ChangeAction):
    return dispatch_change(
        change,
        on_remove=lambda _: {
            "removed": True,
            "id": _,
        },
        on_update=lambda _: {
            "removed": False,
            "node": dict_from_node(_),
        },
    )
