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


def _calculate_scaled_dimensions(
    width: int, height: int, max_size: int
) -> tuple[int, int]:
    """Calculate target dimensions after scaling, without actually scaling the image."""
    if max_size == 0 or (width <= max_size and height <= max_size):
        return width, height

    if width > height:
        new_width = max_size
        new_height = round(height * max_size / width)
    elif width < height:
        new_height = max_size
        new_width = round(width * max_size / height)
    else:
        new_width = max_size
        new_height = max_size

    return new_width, new_height


@asynccontextmanager
async def create_unpack_engine(drive: Drive, port: int, unpack_path: str):
    async with create_storage_manager() as storage:
        with ProcessPoolExecutor() as scaling_pool:
            yield UnpackEngine(drive, port, unpack_path, storage, scaling_pool)


class UnpackEngine:
    def __init__(
        self,
        drive: Drive,
        port: int,
        unpack_path: str,
        storage: StorageManager,
        scaling_pool: ProcessPoolExecutor,
    ) -> None:
        self._drive = drive
        self._port = port
        self._unpack_path = unpack_path
        self._unpacking: dict[str, Condition] = {}
        self._storage = storage
        self._scaling_pool = scaling_pool
        self._scaling: dict[tuple[str, int, int], Condition] = {}

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

    async def prepare_image_for_delivery(
        self, node_id: str, image_index: int, max_size: int
    ) -> None:
        """Prepare an image for delivery to clients.

        Ensures the image at the specified index is ready to be served,
        performing any necessary transformations (scaling, format conversion, etc.).

        Args:
            node_id: The node containing the image
            image_index: Index of the image in the manifest
            max_size: Maximum dimension constraint (0 = no constraint)

        Note:
            This method coordinates concurrent requests using SingleFlight.
            Must be called after get_manifest() to ensure manifest is cached.
        """
        # Get cached manifest
        manifest = self._storage.get_cache_or_none(node_id, max_size)
        if not manifest or image_index >= len(manifest):
            return

        image_dict = manifest[image_index]

        # Fast path: Check if already scaled (no lock needed)
        if image_dict.get("scaled", True):
            return

        key = (node_id, image_index, max_size)

        # Check if already scaling
        if key in self._scaling:
            lock = self._scaling[key]
            await self._wait_for_scaling_result(lock)
            return  # After waking up, scaled flag should be True

        # Start scaling
        lock = Condition()
        self._scaling[key] = lock
        await self._scale_image(key, image_dict, max_size)

    async def _wait_for_scaling_result(self, lock: Condition) -> None:
        """Wait for another request to finish scaling."""
        async with lock:
            await lock.wait()
        # When we wake up, the scaled flag is already True (updated in-place)

    async def _scale_image(
        self, key: tuple[str, int, int], image_dict: dict, max_size: int
    ) -> None:
        """Do the actual scaling work."""
        lock = self._scaling[key]
        try:
            image_path = Path(image_dict["id"])
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                self._scaling_pool, _resize_image, image_path, max_size
            )
            image_dict["scaled"] = True
        finally:
            del self._scaling[key]  # Delete immediately (no periodic cleanup)
            async with lock:
                lock.notify_all()  # Wake all waiting requests

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

        # Collect all image files
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

        # Build manifest with calculated dimensions (no actual scaling yet)
        rv: list[ImageDict] = []
        for path, type_ in files_to_process:
            try:
                # Get original dimensions using fast method (no PIL loading)
                image_info = get_image_info(path)
                original_width = image_info.width
                original_height = image_info.height

                # Calculate target dimensions
                target_width, target_height = _calculate_scaled_dimensions(
                    original_width, original_height, max_size
                )

                # Determine if scaling is needed
                needs_scaling = max_size > 0 and (
                    original_width > max_size or original_height > max_size
                )

                rv.append(
                    {
                        "id": str(path),
                        "type": type_,
                        "size": path.stat().st_size,
                        "etag": parent_node.hash,
                        "mtime": parent_node.mtime,
                        "width": target_width,
                        "height": target_height,
                        "scaled": not needs_scaling,  # True if no scaling needed
                    }
                )
            except Exception as e:
                _L.exception(f"failed to process image {path}: {e}")

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
                        "scaled": True,  # Remote images don't need scaling
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
