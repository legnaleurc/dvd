from asyncio import Condition
from collections.abc import Awaitable, Callable, Hashable


class SingleFlight[K: Hashable, R]:
    """
    Coordinates concurrent operations so only one operation per key executes,
    while others wait. Does NOT handle caching - that's the caller's responsibility.

    This implements the "first-does-work, others-wait" coordination pattern.

    Usage:
        sf = SingleFlight[str, list[dict]]()
        result = await sf(
            key,
            on_first=lambda: do_work_and_cache(),
            on_middle=lambda: fetch_from_cache()
        )
    """

    def __init__(self):
        """Create a new SingleFlight coordinator."""
        self._in_progress: dict[K, Condition] = {}

    async def __call__(
        self,
        key: K,
        *,
        on_first: Callable[[], Awaitable[R]],
        on_middle: Callable[[], Awaitable[R]],
    ) -> R:
        """
        Execute on_first for the first caller, or call on_middle for waiters.

        Args:
            key: Unique identifier for this work (used for deduplication)
            on_first: Async function for first caller (typically: do work + cache)
            on_middle: Async function for waiting callers (typically: fetch from cache)

        Returns:
            Result from either on_first or on_middle (always returns R, never None)
        """
        # Check if work is already in progress
        if key in self._in_progress:
            lock = self._in_progress[key]
            await self._wait(lock)
            return await on_middle()  # Waiting caller: run on_middle callback

        # First caller: start the work
        lock = Condition()
        self._in_progress[key] = lock
        return await self._do_work(key, lock, on_first)

    async def _wait(self, lock: Condition) -> None:
        """Wait for another coroutine to complete the work."""
        async with lock:
            await lock.wait()

    async def _do_work(
        self, key: K, lock: Condition, work_fn: Callable[[], Awaitable[R]]
    ) -> R:
        """Execute the actual work and notify waiters."""
        try:
            return await work_fn()
        finally:
            del self._in_progress[key]
            async with lock:
                lock.notify_all()

    def __contains__(self, key: K) -> bool:
        """Check if work is in progress for the given key."""
        return key in self._in_progress

    async def wait_all(self) -> None:
        """Wait for all in-progress operations to complete."""
        while len(self._in_progress) > 0:
            _key, lock = next(iter(self._in_progress.items()))
            async with lock:
                await lock.wait()
