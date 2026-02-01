from asyncio import Condition
from collections.abc import Awaitable, Callable, Hashable


class SingleFlight[K: Hashable, R]:
    """
    Coordinates concurrent operations so only one operation per key executes,
    while others wait. Does NOT handle caching - that's the caller's responsibility.

    This implements the "first-does-work, others-wait" coordination pattern.

    Usage:
        sf = SingleFlight[str, list[dict]]()
        result = await sf(key, work_fn)
    """

    def __init__(self):
        """Create a new SingleFlight coordinator."""
        self._in_progress: dict[K, Condition] = {}

    async def __call__(self, key: K, work_fn: Callable[[], Awaitable[R]]) -> R | None:
        """
        Execute work_fn for the given key, or wait if already in progress.

        Args:
            key: Unique identifier for this work (used for deduplication)
            work_fn: Async function to execute (takes no args, returns R)

        Returns:
            Result of work_fn if first caller, None if waiter (fetch from your cache)
        """
        # Check if work is already in progress
        if key in self._in_progress:
            lock = self._in_progress[key]
            await self._wait(lock)
            return None  # Caller must fetch from their own cache

        # Start the work
        lock = Condition()
        self._in_progress[key] = lock
        return await self._do_work(key, lock, work_fn)

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
