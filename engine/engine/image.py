from pathlib import Path

from PIL import Image
import pillow_avif as pillow_avif  # type: ignore


# relax decompression bomb check
Image.MAX_IMAGE_PIXELS = None


def get_image_size(path: Path) -> tuple[int, int]:
    image = Image.open(path)  # type: ignore
    return image.size
