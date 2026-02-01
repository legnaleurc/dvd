from logging import getLogger
from pathlib import Path

from PIL import Image
from wcpan.drive.cli.lib import get_image_info


_L = getLogger(__name__)


def calculate_scaled_dimensions(
    original_width: int, original_height: int, max_size: int
) -> tuple[int, int]:
    """
    Calculate target dimensions for image scaling while maintaining aspect ratio.

    Args:
        original_width: Original image width in pixels
        original_height: Original image height in pixels
        max_size: Maximum dimension (0 means no scaling)

    Returns:
        Tuple of (width, height) for scaled dimensions
    """
    # No scaling needed
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

    return new_width, new_height


def resize_image(input_path: Path, max_size: int) -> tuple[int, int]:
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

    # Calculate target dimensions
    new_width, new_height = calculate_scaled_dimensions(
        original_width, original_height, max_size
    )

    # No resizing needed
    if new_width == original_width and new_height == original_height:
        return original_width, original_height

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


def resize_image_with_index(
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
    width, height = resize_image(input_path, max_size)
    return idx, width, height
