from aiohttp.web import AppKey
from pathlib import Path

from wcpan.drive.core.types import Drive

from .search import SearchEngine
from .unpack import UnpackEngine


KEY_DRIVE = AppKey("KEY_DRIVE", Drive)
KEY_SEARCH_ENGINE = AppKey("KEY_SEARCH_ENGINE", SearchEngine)
KEY_STATIC = AppKey("KEY_STATIC", Path)
KEY_TOKEN = AppKey("KEY_TOKEN", str)
KEY_UNPACK_ENGINE = AppKey("KEY_UNPACK_ENGINE", UnpackEngine)
