import asyncio
import re
from asyncio import as_completed, create_subprocess_exec
from asyncio.subprocess import PIPE
from concurrent.futures import ProcessPoolExecutor
from contextlib import asynccontextmanager
from itertools import zip_longest
from logging import getLogger
from mimetypes import guess_type
from pathlib import Path
from typing import Self

from wcpan.drive.core.types import Drive, Node

from .image import resize_image_with_index
from .singleflight import SingleFlight
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
        self._singleflight = SingleFlight[str, list[ImageDict]]()
        self._storage = storage

    async def get_manifest(self, node: Node, max_size: int = 0) -> list[ImageDict]:
        # Fast path: check cache first
        manifest = self._storage.get_cache_or_none(node.id, max_size)
        if manifest is not None:
            return manifest

        # Use singleflight to coordinate concurrent unpacking
        result = await self._singleflight(
            node.id, lambda: self._do_unpack(node, max_size)
        )

        if result is not None:
            # First caller: cache and return result
            self._storage.set_cache(node.id, max_size, result)
            return result

        # Waiter: fetch from cache
        try:
            return self._storage.get_cache(node.id, max_size)
        except KeyError:
            raise UnpackFailedError(f"{node.id} unpack was canceled")

    @property
    def cache(self):
        return self._storage.cache

    def clear_cache(self):
        self._storage.clear_cache()

    async def _do_unpack(self, node: Node, max_size: int) -> list[ImageDict]:
        try:
            if node.is_directory:
                manifest = await self._unpack_remote(node)
            else:
                manifest = await self._unpack_local(node.id, max_size)
            return manifest
        except UnpackFailedError:
            raise
        except Exception as e:
            _L.exception("unpack failed, abort")
            raise UnpackFailedError(str(e)) from e

    async def _unpack_local(self, node_id: str, max_size: int) -> list[ImageDict]:
        cmd = [
            self._unpack_path,
            _get_node_url(self._port, node_id),
            str(self._storage.get_path(node_id, max_size)),
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
                f"unpack failed code: {p.returncode}\n\n{err.decode('utf-8')}"
            )
        return await self._scan_local(node_id, max_size)

    async def _scan_local(self, node_id: str, max_size: int) -> list[ImageDict]:
        parent_node = await self._drive.get_node_by_id(node_id)

        # First pass: collect all image files
        files_to_process: list[tuple[Path, str]] = []
        top = self._storage.get_path(node_id, max_size)
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

                files_to_process.append((path, type_))

        if not files_to_process:
            return []

        # Process images in parallel using process pool
        loop = asyncio.get_event_loop()
        results: list[tuple[int, Path, str, int, int]] = []

        with ProcessPoolExecutor() as executor:
            # Submit all tasks using enumerate for index tracking
            tasks = [
                loop.run_in_executor(
                    executor, resize_image_with_index, idx, path, max_size
                )
                for idx, (path, _type) in enumerate(files_to_process)
            ]

            # Collect results as they complete
            for completed_task in as_completed(tasks):
                try:
                    idx, width, height = await completed_task
                    # Get the corresponding path and type from the original list
                    path, type_ = files_to_process[idx]
                    results.append((idx, path, type_, width, height))
                except Exception as e:
                    _L.exception(f"failed to process image: {e}")

        # Sort by index to preserve order
        results.sort(key=lambda x: x[0])

        # Build final result list using list comprehension
        rv: list[ImageDict] = [
            {
                "id": str(path),
                "type": type_,
                "size": path.stat().st_size,
                "etag": parent_node.hash,
                "mtime": parent_node.mtime,
                "width": width,
                "height": height,
            }
            for _idx, path, type_, width, height in results
        ]
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
                        "etag": f.hash,
                        "mtime": f.mtime,
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


def _get_node_url(port: int, node_id: str) -> str:
    return f"http://localhost:{port}/api/v1/nodes/{node_id}/stream"
