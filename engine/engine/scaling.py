from asyncio import get_event_loop
from concurrent.futures import ProcessPoolExecutor
from contextlib import asynccontextmanager
from pathlib import Path

from PIL import Image
from wcpan.drive.cli.lib import get_image_info

from .singleflight import SingleFlight
from .types import ImageDict


def calculate_scaled_dimensions(
    width: int, height: int, max_size: int
) -> tuple[int, int]:
    """
    Calculate target dimensions without actually scaling image.

    Pure function with no side effects - can be used without service instance.
    """
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
async def create_scaling_service():
    """
    Create ImageScalingService with managed ProcessPoolExecutor lifecycle.

    Follows the same pattern as create_storage_manager() and create_unpack_engine().
    Uses ProcessPoolExecutor's default max_workers (ideal for CPU-bound work).
    """
    with ProcessPoolExecutor() as scaling_pool:
        yield ImageScalingService(scaling_pool)


class ImageScalingService:
    """Handles PIL-based image scaling with concurrency coordination."""

    def __init__(self, scaling_pool: ProcessPoolExecutor):
        self._scaling_pool = scaling_pool
        self._scaling = SingleFlight[tuple[str, int, int], None]()

    async def ensure_scaled(
        self,
        image_dict: ImageDict,
        key: tuple[str, int, int],  # For SingleFlight coordination
    ) -> None:
        """Ensure image is scaled, coordinating concurrent requests."""
        # Fast path: Check if already scaled (no lock needed)
        if image_dict.get("scaled", True):
            return

        # Use singleflight for coordination
        await self._scaling(key, lambda: self._scale_work(image_dict))
        # After waking up, scaled flag is True (in-place mutation by first caller)

    async def _scale_work(self, image_dict: ImageDict) -> None:
        """Do the actual scaling work."""
        image_path = Path(image_dict["id"])
        target_width = image_dict["width"]
        target_height = image_dict["height"]
        loop = get_event_loop()
        await loop.run_in_executor(
            self._scaling_pool, _resize_image, image_path, target_width, target_height
        )
        image_dict["scaled"] = True  # In-place mutation for cache


def _resize_image(
    input_path: Path, target_width: int, target_height: int
) -> tuple[int, int]:
    """
    Resize image in-place to target dimensions.

    Args:
        input_path: Path to the image file
        target_width: Target width in pixels
        target_height: Target height in pixels

    Returns:
        Tuple of (width, height) after resize

    Raises:
        Exception if image processing fails

    Note:
        Target dimensions should be pre-calculated using calculate_scaled_dimensions().
        This function assumes target dimensions are already correct and performs the resize.
    """
    # Get current dimensions to check if resize is needed
    image_info = get_image_info(input_path)

    # No resizing needed if already at target dimensions
    if image_info.width == target_width and image_info.height == target_height:
        return target_width, target_height

    # Open with PIL for actual resizing
    with Image.open(input_path) as img:
        # Resize using high-quality Lanczos resampling
        resized_img = img.resize(
            (target_width, target_height), Image.Resampling.LANCZOS
        )

        # Determine save parameters based on format
        save_kwargs = {}
        if img.format == "JPEG":
            save_kwargs["quality"] = 85
            save_kwargs["optimize"] = True
        elif img.format == "PNG":
            save_kwargs["optimize"] = True

        # Save in-place, preserving format
        resized_img.save(input_path, format=img.format, **save_kwargs)

    return target_width, target_height
