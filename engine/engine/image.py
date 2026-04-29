from logging import getLogger
from pathlib import Path
from tempfile import NamedTemporaryFile

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


def resize_image_to(
    input_path: Path, output_path: Path, max_size: int
) -> tuple[int, int]:
    """
    Resize image to a separate path, leaving the source image untouched.

    The output is written through a temporary sibling and atomically moved into
    place so readers never observe a partial image.
    """
    image_info = get_image_info(input_path)
    original_width = image_info.width
    original_height = image_info.height
    new_width, new_height = calculate_scaled_dimensions(
        original_width, original_height, max_size
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(input_path) as img:
        save_kwargs = {}
        if img.format == "JPEG":
            save_kwargs["quality"] = 85
            save_kwargs["optimize"] = True
        elif img.format == "PNG":
            save_kwargs["optimize"] = True

        with NamedTemporaryFile(
            dir=output_path.parent,
            prefix=f".{output_path.name}.",
            suffix=".tmp",
            delete=False,
        ) as f:
            tmp_path = Path(f.name)

        try:
            resized_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            resized_img.save(tmp_path, format=img.format, **save_kwargs)
            tmp_path.replace(output_path)
        except Exception:
            tmp_path.unlink(missing_ok=True)
            raise

    _L.info(
        f"resized image: {input_path.name}, {original_width}x{original_height} -> {new_width}x{new_height}"
    )

    return new_width, new_height
