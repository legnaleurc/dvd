from pathlib import Path

from aiohttp.web import AppKey
from wcpan.drive.core.types import Drive

from .search import SearchEngine
from .unpack import UnpackEngine


KEY_DRIVE = AppKey[Drive]("KEY_DRIVE")
KEY_SEARCH_ENGINE = AppKey[SearchEngine]("KEY_SEARCH_ENGINE")
KEY_STATIC = AppKey[Path]("KEY_STATIC")
KEY_TOKEN = AppKey[str | None]("KEY_TOKEN")
KEY_UNPACK_ENGINE = AppKey[UnpackEngine]("KEY_UNPACK_ENGINE")
