import asyncio
import re
from asyncio import create_subprocess_exec
from asyncio.subprocess import PIPE
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from itertools import zip_longest
from logging import getLogger
from mimetypes import guess_type
from pathlib import Path
from typing import Self

from wcpan.drive.core.types import Drive, Node

from .image import calculate_scaled_dimensions, resize_image_to
from .singleflight import SingleFlight
from .storage import StorageManager, create_storage_manager
from .types import ImageDict


_L = getLogger(__name__)


class UnpackFailedError(Exception):
    pass


@asynccontextmanager
async def create_unpack_engine(drive: Drive, port: int, unpack_path: str):
    with ThreadPoolExecutor() as executor:
        async with create_storage_manager() as storage:
            yield UnpackEngine(drive, port, unpack_path, storage, executor)


class UnpackEngine:
    def __init__(
        self,
        drive: Drive,
        port: int,
        unpack_path: str,
        storage: StorageManager,
        resize_executor: ThreadPoolExecutor,
    ) -> None:
        self._drive = drive
        self._port = port
        self._unpack_path = unpack_path
        self._singleflight = SingleFlight[tuple[str, int], list[ImageDict]]()
        self._resize_singleflight = SingleFlight[tuple[str, int, int], Path]()
        self._storage = storage
        self._resize_executor = resize_executor

    async def get_manifest(self, node: Node, max_size: int = 0) -> list[ImageDict]:
        if node.is_directory:
            return await self._get_remote_manifest(node, max_size)
        return await self._get_local_manifest(node, max_size)

    async def get_local_image_path(
        self, node: Node, image_id: int, data: ImageDict, max_size: int
    ) -> Path:
        source_path = Path(data["id"])
        if max_size == 0:
            return source_path

        width, height = calculate_scaled_dimensions(
            data["width"], data["height"], max_size
        )
        if width == data["width"] and height == data["height"]:
            return source_path

        source_root = self._storage.get_path(node.id, 0)
        variant_root = self._storage.get_path(node.id, max_size)
        variant_path = variant_root / source_path.relative_to(source_root)
        if variant_path.exists():
            return variant_path

        key = (node.id, image_id, max_size)

        async def on_first():
            if variant_path.exists():
                return variant_path
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                self._resize_executor,
                resize_image_to,
                source_path,
                variant_path,
                max_size,
            )
            return variant_path

        async def on_middle():
            if not variant_path.exists():
                raise UnpackFailedError(f"{variant_path} was not created")
            return variant_path

        return await self._resize_singleflight(
            key, on_first=on_first, on_middle=on_middle
        )

    async def _get_local_manifest(self, node: Node, max_size: int) -> list[ImageDict]:
        manifest = self._storage.get_cache_or_none(node.id, max_size)
        if manifest is not None:
            return manifest

        if max_size != 0:
            original_manifest = await self.get_manifest(node, 0)
            manifest = self._resize_manifest(original_manifest, max_size)
            self._storage.set_cache(node.id, max_size, manifest)
            return manifest

        key = (node.id, 0)

        async def on_first():
            result = await self._do_unpack(node)
            self._storage.set_cache(node.id, max_size, result)
            return result

        async def on_middle():
            return self._storage.get_cache(node.id, max_size)

        try:
            return await self._singleflight(key, on_first=on_first, on_middle=on_middle)
        except KeyError:
            raise UnpackFailedError(f"{node.id} unpack was canceled")

    async def _get_remote_manifest(self, node: Node, max_size: int) -> list[ImageDict]:
        manifest = self._storage.get_cache_or_none(node.id, max_size)
        if manifest is not None:
            return manifest

        key = (node.id, max_size)

        async def on_first():
            result = await self._do_unpack(node)
            self._storage.set_cache(node.id, max_size, result)
            return result

        async def on_middle():
            return self._storage.get_cache(node.id, max_size)

        try:
            return await self._singleflight(key, on_first=on_first, on_middle=on_middle)
        except KeyError:
            raise UnpackFailedError(f"{node.id} unpack was canceled")

    def get_cache_by_max_size(self, max_size: int):
        return self._storage.get_cache_by_max_size(max_size)

    def clear_cache(self):
        self._storage.clear_cache()

    async def _do_unpack(self, node: Node) -> list[ImageDict]:
        try:
            if node.is_directory:
                manifest = await self._unpack_remote(node)
            else:
                manifest = await self._unpack_local(node.id)
            return manifest
        except UnpackFailedError:
            raise
        except Exception as e:
            _L.exception("unpack failed, abort")
            raise UnpackFailedError(str(e)) from e

    async def _unpack_local(self, node_id: str) -> list[ImageDict]:
        cmd = [
            self._unpack_path,
            _get_node_url(self._port, node_id),
            str(self._storage.get_path(node_id, 0)),
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
        return await self._scan_local(node_id)

    async def _scan_local(self, node_id: str) -> list[ImageDict]:
        parent_node = await self._drive.get_node_by_id(node_id)

        # First pass: collect all image files
        files_to_process: list[tuple[Path, str]] = []
        top = self._storage.get_path(node_id, 0)
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

        results: list[tuple[int, Path, str, int, int]] = []
        for idx, (path, type_) in enumerate(files_to_process):
            try:
                width, height = self._get_image_size(path)
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

    def _resize_manifest(
        self, manifest: list[ImageDict], max_size: int
    ) -> list[ImageDict]:
        rv: list[ImageDict] = []
        for item in manifest:
            width, height = calculate_scaled_dimensions(
                item["width"], item["height"], max_size
            )
            resized = item.copy()
            resized["width"] = width
            resized["height"] = height
            rv.append(resized)
        return rv

    def _get_image_size(self, path: Path) -> tuple[int, int]:
        from wcpan.drive.cli.lib import get_image_info

        image_info = get_image_info(path)
        return image_info.width, image_info.height

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
