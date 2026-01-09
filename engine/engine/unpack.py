import asyncio
import re
from asyncio import Condition, as_completed, create_subprocess_exec
from asyncio.subprocess import PIPE
from concurrent.futures import ProcessPoolExecutor
from contextlib import asynccontextmanager
from itertools import zip_longest
from logging import getLogger
from mimetypes import guess_type
from pathlib import Path
from typing import Self

from PIL import Image
from wcpan.drive.cli.lib import get_image_info
from wcpan.drive.core.types import Drive, Node

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

    async def get_manifest(self, node: Node, max_size: int = 0) -> list[ImageDict]:
        manifest = self._storage.get_cache_or_none(node.id, max_size)
        if manifest is not None:
            return manifest

        if node.id in self._unpacking:
            lock = self._unpacking[node.id]
            return await self._wait_for_result(lock, node.id, max_size)

        lock = Condition()
        self._unpacking[node.id] = lock
        return await self._unpack(node, max_size)

    @property
    def cache(self):
        return self._storage.cache

    def clear_cache(self):
        self._storage.clear_cache()

    async def _unpack(self, node: Node, max_size: int) -> list[ImageDict]:
        lock = self._unpacking[node.id]
        try:
            if node.is_directory:
                manifest = await self._unpack_remote(node)
            else:
                manifest = await self._unpack_local(node.id, max_size)
            self._storage.set_cache(node.id, max_size, manifest)
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
        max_size: int,
    ) -> list[ImageDict]:
        async with lock:
            await lock.wait()
        try:
            return self._storage.get_cache(node_id, max_size)
        except KeyError:
            raise UnpackFailedError(f"{node_id} canceled unpack")

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
                    executor, _resize_image_with_index, idx, path, max_size
                )
                for idx, (path, type_) in enumerate(files_to_process)
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
            for idx, path, type_, width, height in results
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


def _resize_image(input_path: Path, max_size: int) -> tuple[int, int]:
    """
    Resize image in-place if dimensions exceed max_size.
    Maintains aspect ratio, scaling so both width and height are <= max_size.

    Args:
        input_path: Path to the image file
        max_size: Maximum dimension (0 means no resize)

    Returns:
        Tuple of (width, height) after resize

    Raises:
        Exception if image processing fails
    """
    # Use get_image_info for lighter processing to check dimensions first
    image_info = get_image_info(input_path)
    original_width = image_info.width
    original_height = image_info.height

    # No resizing needed
    if max_size == 0 or (original_width <= max_size and original_height <= max_size):
        return original_width, original_height

    # Calculate new dimensions maintaining aspect ratio
    # Scale so max(width, height) = max_size
    if original_width > original_height:
        new_width = max_size
        new_height = round(original_height * max_size / original_width)
    elif original_width < original_height:
        new_height = max_size
        new_width = round(original_width * max_size / original_height)
    else:
        new_width = max_size
        new_height = max_size

    # Now open with PIL for actual resizing
    with Image.open(input_path) as img:
        # Resize using high-quality Lanczos resampling
        resized_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

        # Determine save parameters based on format
        save_kwargs = {}
        if img.format == "JPEG":
            save_kwargs["quality"] = 85
            save_kwargs["optimize"] = True
        elif img.format == "PNG":
            save_kwargs["optimize"] = True

        # Save in-place, preserving format
        resized_img.save(input_path, format=img.format, **save_kwargs)

    _L.info(
        f"resized image: {input_path.name}, {original_width}x{original_height} -> {new_width}x{new_height}"
    )

    return new_width, new_height


def _resize_image_with_index(
    idx: int, input_path: Path, max_size: int
) -> tuple[int, int, int]:
    """
    Wrapper function to resize image with index for preserving order.

    Args:
        idx: Index to preserve file order
        input_path: Path to the image file
        max_size: Maximum dimension (0 means no resize)

    Returns:
        Tuple of (idx, width, height) after resize
    """
    width, height = _resize_image(input_path, max_size)
    return idx, width, height
