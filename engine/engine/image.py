from pathlib import Path

from wcpan.drive.cli.lib import get_image_info


def get_image_size(path: Path) -> tuple[int, int]:
    info = get_image_info(path)
    return info.width, info.height
