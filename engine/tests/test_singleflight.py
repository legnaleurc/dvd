import asyncio
from unittest import IsolatedAsyncioTestCase

from engine.singleflight import SingleFlight


class TestSingleFlight(IsolatedAsyncioTestCase):
    async def test_concurrent_same_key(self):
        """First does work, others wait. First gets result, waiters get None."""
        work_count = 0
        cache = {}

        async def work():
            nonlocal work_count
            work_count += 1
            await asyncio.sleep(0.1)
            result = "result-1"
            cache["key1"] = result  # Simulate host caching
            return result

        sf = SingleFlight[str, str]()

        # Start 10 concurrent calls
        results = await asyncio.gather(*[sf("key1", work) for _ in range(10)])

        # First caller gets result, others get None (must fetch from cache)
        self.assertEqual(results.count(None), 9)  # 9 waiters
        self.assertEqual(results.count("result-1"), 1)  # 1 doer
        self.assertEqual(work_count, 1)  # Work executed once
        self.assertEqual(cache["key1"], "result-1")  # Host cached it

    async def test_concurrent_different_keys(self):
        """Different keys execute concurrently."""
        work_counts = {}

        async def make_work(key: str):
            async def work():
                work_counts[key] = work_counts.get(key, 0) + 1
                await asyncio.sleep(0.05)
                return f"result-{key}"

            return work

        sf = SingleFlight[str, str]()

        # Start concurrent calls with different keys
        results = await asyncio.gather(
            sf("key1", await make_work("key1")),
            sf("key2", await make_work("key2")),
            sf("key3", await make_work("key3")),
        )

        # Each key executes once
        self.assertEqual(work_counts, {"key1": 1, "key2": 1, "key3": 1})
        self.assertEqual(set(results), {"result-key1", "result-key2", "result-key3"})

    async def test_error_propagation(self):
        """Errors propagate to the first caller."""
        work_count = 0

        async def failing_work():
            nonlocal work_count
            work_count += 1
            await asyncio.sleep(0.05)
            raise ValueError("work failed")

        sf = SingleFlight[str, str]()

        # Start multiple concurrent calls
        tasks = [sf("key1", failing_work) for _ in range(5)]

        results = []
        exceptions = []
        for task in asyncio.as_completed(tasks):
            try:
                result = await task
                results.append(result)
            except ValueError as e:
                exceptions.append(str(e))

        # First caller gets the exception
        self.assertEqual(len(exceptions), 1)
        self.assertEqual(exceptions[0], "work failed")
        # Others get None (waiters)
        self.assertEqual(len(results), 4)
        self.assertTrue(all(r is None for r in results))
        # Work executed once
        self.assertEqual(work_count, 1)

    async def test_sequential_same_key(self):
        """Sequential calls with same key each do work."""
        work_count = 0

        async def work():
            nonlocal work_count
            work_count += 1
            return f"result-{work_count}"

        sf = SingleFlight[str, str]()

        # First call
        result1 = await sf("key1", work)
        self.assertEqual(result1, "result-1")
        self.assertEqual(work_count, 1)

        # Second call (not concurrent, should do work again)
        result2 = await sf("key1", work)
        self.assertEqual(result2, "result-2")
        self.assertEqual(work_count, 2)

    async def test_tuple_keys(self):
        """Supports tuple keys for multi-parameter deduplication."""
        work_count = {}

        async def work(a: str, b: int):
            key = (a, b)
            work_count[key] = work_count.get(key, 0) + 1
            await asyncio.sleep(0.05)
            return f"{a}-{b}"

        sf = SingleFlight[tuple[str, int], str]()

        # Concurrent calls with same tuple key
        results = await asyncio.gather(
            *[sf(("foo", 42), lambda: work("foo", 42)) for _ in range(5)]
        )

        self.assertEqual(results.count(None), 4)  # 4 waiters
        self.assertEqual(results.count("foo-42"), 1)  # 1 doer
        self.assertEqual(work_count[("foo", 42)], 1)

    async def test_none_result(self):
        """Work function can return None as a valid result."""
        work_count = 0
        cache = {}

        async def work():
            nonlocal work_count
            work_count += 1
            await asyncio.sleep(0.05)
            cache["key1"] = None  # Explicitly cache None
            return None

        sf = SingleFlight[str, None]()

        # Start concurrent calls
        results = await asyncio.gather(*[sf("key1", work) for _ in range(5)])

        # First caller gets None (the actual result)
        # Waiters also get None (the sentinel)
        # Host must check cache to distinguish
        self.assertTrue(all(r is None for r in results))
        self.assertEqual(work_count, 1)
        self.assertIn("key1", cache)
        self.assertIsNone(cache["key1"])

    async def test_cleanup_after_work(self):
        """Lock is cleaned up after work completes."""

        async def work():
            await asyncio.sleep(0.05)
            return "result"

        sf = SingleFlight[str, str]()

        # Do work
        await sf("key1", work)

        # Lock should be removed
        self.assertNotIn("key1", sf._in_progress)

        # Next call should do work again (not wait on stale lock)
        work_count = 0

        async def work2():
            nonlocal work_count
            work_count += 1
            return "result2"

        result = await sf("key1", work2)
        self.assertEqual(result, "result2")
        self.assertEqual(work_count, 1)

    async def test_cleanup_after_error(self):
        """Lock is cleaned up even when work raises exception."""

        async def failing_work():
            await asyncio.sleep(0.05)
            raise ValueError("error")

        sf = SingleFlight[str, str]()

        # Do work that fails
        with self.assertRaises(ValueError):
            await sf("key1", failing_work)

        # Lock should be removed
        self.assertNotIn("key1", sf._in_progress)

        # Next call should do work again
        work_count = 0

        async def work2():
            nonlocal work_count
            work_count += 1
            return "result"

        result = await sf("key1", work2)
        self.assertEqual(result, "result")
        self.assertEqual(work_count, 1)

    async def test_contains(self):
        """Test __contains__ for checking in-progress operations."""

        async def slow_work():
            await asyncio.sleep(0.1)
            return "result"

        sf = SingleFlight[str, str]()

        # Start work in background
        task = asyncio.create_task(sf("key1", slow_work))
        await asyncio.sleep(0.01)  # Let it start

        # Check it's in progress
        self.assertIn("key1", sf)
        self.assertNotIn("key2", sf)

        # Wait for completion
        await task

        # Check it's no longer in progress
        self.assertNotIn("key1", sf)

    async def test_wait_all(self):
        """Test wait_all waits for all operations to complete."""
        completed = []

        async def work(key: str):
            await asyncio.sleep(0.05)
            completed.append(key)
            return f"result-{key}"

        sf = SingleFlight[str, str]()

        # Start multiple operations
        asyncio.create_task(sf("key1", lambda: work("key1")))
        asyncio.create_task(sf("key2", lambda: work("key2")))
        asyncio.create_task(sf("key3", lambda: work("key3")))
        await asyncio.sleep(0.01)  # Let them start

        # Wait for all to complete
        await sf.wait_all()

        # All should be done
        self.assertEqual(len(completed), 3)
        self.assertCountEqual(completed, ["key1", "key2", "key3"])
