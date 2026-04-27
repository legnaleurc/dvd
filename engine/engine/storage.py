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
        self._cache: dict[int, dict[str, list[ImageDict]]] = {}
        self._path = path

    def clear_cache(self):
        self._cache = {}
        for child in self._path.iterdir():
            shutil.rmtree(str(child))

    def get_cache(self, id_: str, max_size: int = 0) -> list[ImageDict]:
        return self._cache[max_size][id_]

    def get_cache_or_none(self, id_: str, max_size: int = 0) -> list[ImageDict] | None:
        return self._cache.get(max_size, {}).get(id_, None)

    def set_cache(self, id_: str, max_size: int, manifest: list[ImageDict]) -> None:
        if max_size not in self._cache:
            self._cache[max_size] = {}
        self._cache[max_size][id_] = manifest

    def get_path(self, id_: str, max_size: int = 0) -> Path:
        return self._path / str(max_size) / id_

    def get_cache_by_max_size(self, max_size: int):
        return self._cache[max_size]

    @property
    def root_path(self) -> Path:
        return self._path

    def check(self):
        DAY = 60 * 60 * 24
        now = time.time()
        for size_dir in self._path.iterdir():
            if not size_dir.is_dir():
                continue
            max_size = int(size_dir.name)

            # Check each node_id subdirectory
            for node_dir in size_dir.iterdir():
                if not node_dir.is_dir():
                    continue
                node_id = node_dir.name
                s = node_dir.stat()
                d = now - s.st_mtime
                _L.debug(f"check {node_dir} ({d})")
                if d > DAY:
                    shutil.rmtree(str(node_dir))
                    if max_size in self._cache and node_id in self._cache[max_size]:
                        del self._cache[max_size][node_id]
                    _L.info(f"prune {node_dir} ({d})")


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
