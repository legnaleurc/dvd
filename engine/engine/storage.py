import shutil
import time
from asyncio import CancelledError, create_task, sleep
from collections.abc import Callable
from contextlib import AsyncExitStack, asynccontextmanager
from logging import getLogger
from pathlib import Path
from tempfile import TemporaryDirectory

from .types import ImageDict


_L = getLogger(__name__)


@asynccontextmanager
async def create_storage_manager():
    async with AsyncExitStack() as stack:
        tmp = stack.enter_context(TemporaryDirectory())
        path = Path(tmp)
        storage = StorageManager(path)
        await stack.enter_async_context(_watch(storage.check))
        yield storage


class StorageManager:
    def __init__(self, path: Path):
        self._cache: dict[str, list[ImageDict]] = {}
        self._path = path

    def clear_cache(self):
        self._cache = {}
        for child in self._path.iterdir():
            shutil.rmtree(str(child))

    def get_cache(self, id_: str) -> list[ImageDict]:
        return self._cache[id_]

    def get_cache_or_none(self, id_: str) -> list[ImageDict] | None:
        return self._cache.get(id_, None)

    def set_cache(self, id_: str, manifest: list[ImageDict]) -> None:
        self._cache[id_] = manifest

    def get_path(self, id_: str) -> Path:
        return self._path / id_

    @property
    def cache(self):
        return self._cache

    @property
    def root_path(self) -> Path:
        return self._path

    def check(self):
        DAY = 60 * 60 * 24
        now = time.time()
        for child in self._path.iterdir():
            s = child.stat()
            d = now - s.st_mtime
            _L.debug(f"check {child} ({d})")
            if d > DAY:
                shutil.rmtree(str(child))
                del self._cache[child.name]
                _L.info(f"prune {child} ({d})")


@asynccontextmanager
async def _watch(fn: Callable[[], None]):
    task = create_task(_loop(fn))
    try:
        yield
    finally:
        task.cancel()
        try:
            await task
        except CancelledError:
            task = None


async def _loop(fn: Callable[[], None]):
    while True:
        await sleep(60 * 60)
        fn()
