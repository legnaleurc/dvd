import asyncio
from unittest import IsolatedAsyncioTestCase

from engine.singleflight import SingleFlight


class TestSingleFlight(IsolatedAsyncioTestCase):
    async def test_concurrent_same_key(self):
        """First does work, others wait. All get result from their callbacks."""
        work_count = 0
        cache = {}

        async def on_first():
            nonlocal work_count
            work_count += 1
            await asyncio.sleep(0.1)
            result = "result-1"
            cache["key1"] = result  # Simulate host caching
            return result

        async def on_middle():
            return cache["key1"]

        sf = SingleFlight[str, str]()

        # Start 10 concurrent calls
        results = await asyncio.gather(
            *[sf("key1", on_first=on_first, on_middle=on_middle) for _ in range(10)]
        )

        # All callers get the same result
        self.assertTrue(all(r == "result-1" for r in results))
        self.assertEqual(work_count, 1)  # Work executed once
        self.assertEqual(cache["key1"], "result-1")  # Host cached it

    async def test_concurrent_different_keys(self):
        """Different keys execute concurrently."""
        work_counts = {}
        cache = {}

        async def make_work(key: str):
            async def on_first():
                work_counts[key] = work_counts.get(key, 0) + 1
                await asyncio.sleep(0.05)
                result = f"result-{key}"
                cache[key] = result
                return result

            return on_first

        sf = SingleFlight[str, str]()

        # Start concurrent calls with different keys
        results = await asyncio.gather(
            sf(
                "key1",
                on_first=await make_work("key1"),
                on_middle=lambda: cache["key1"],
            ),
            sf(
                "key2",
                on_first=await make_work("key2"),
                on_middle=lambda: cache["key2"],
            ),
            sf(
                "key3",
                on_first=await make_work("key3"),
                on_middle=lambda: cache["key3"],
            ),
        )

        # Each key executes once
        self.assertEqual(work_counts, {"key1": 1, "key2": 1, "key3": 1})
        self.assertEqual(set(results), {"result-key1", "result-key2", "result-key3"})

    async def test_error_propagation(self):
        """Errors propagate to first caller, waiters may also fail in on_middle."""
        work_count = 0
        cache = {}

        async def failing_work():
            nonlocal work_count
            work_count += 1
            await asyncio.sleep(0.05)
            raise ValueError("work failed")

        sf = SingleFlight[str, str]()

        # Start multiple concurrent calls
        tasks = [
            sf("key1", on_first=failing_work, on_middle=lambda: cache["key1"])
            for _ in range(5)
        ]

        results = []
        value_errors = []
        key_errors = []
        for task in asyncio.as_completed(tasks):
            try:
                result = await task
                results.append(result)
            except ValueError as e:
                value_errors.append(str(e))
            except KeyError:
                key_errors.append("key1")

        # First caller gets the ValueError
        self.assertEqual(len(value_errors), 1)
        self.assertEqual(value_errors[0], "work failed")
        # Waiters try to fetch from cache and get KeyError (cache was never populated)
        self.assertEqual(len(key_errors), 4)
        # No successful results
        self.assertEqual(len(results), 0)
        # Work executed once
        self.assertEqual(work_count, 1)

    async def test_sequential_same_key(self):
        """Sequential calls with same key each do work."""
        work_count = 0
        cache = {}

        async def work():
            nonlocal work_count
            work_count += 1
            result = f"result-{work_count}"
            cache["key1"] = result
            return result

        sf = SingleFlight[str, str]()

        # First call
        result1 = await sf("key1", on_first=work, on_middle=lambda: cache["key1"])
        self.assertEqual(result1, "result-1")
        self.assertEqual(work_count, 1)

        # Second call (not concurrent, should do work again)
        result2 = await sf("key1", on_first=work, on_middle=lambda: cache["key1"])
        self.assertEqual(result2, "result-2")
        self.assertEqual(work_count, 2)

    async def test_tuple_keys(self):
        """Supports tuple keys for multi-parameter deduplication."""
        work_count = {}
        cache = {}

        async def work(a: str, b: int):
            key = (a, b)
            work_count[key] = work_count.get(key, 0) + 1
            await asyncio.sleep(0.05)
            result = f"{a}-{b}"
            cache[key] = result
            return result

        async def on_middle():
            return cache[("foo", 42)]

        sf = SingleFlight[tuple[str, int], str]()

        # Concurrent calls with same tuple key
        results = await asyncio.gather(
            *[
                sf(("foo", 42), on_first=lambda: work("foo", 42), on_middle=on_middle)
                for _ in range(5)
            ]
        )

        # All callers get the same result
        self.assertTrue(all(r == "foo-42" for r in results))
        self.assertEqual(work_count[("foo", 42)], 1)

    async def test_none_result(self):
        """Work function can return None as a valid result with two-callback pattern."""
        work_count = 0
        cache: dict[str, int | None] = {}

        async def on_first():
            nonlocal work_count
            work_count += 1
            await asyncio.sleep(0.05)
            cache["key1"] = None  # Explicitly cache None
            return None

        async def on_middle():
            return cache["key1"]

        sf = SingleFlight[str, int | None]()

        # Start concurrent calls
        results = await asyncio.gather(
            *[sf("key1", on_first=on_first, on_middle=on_middle) for _ in range(5)]
        )

        # All callers get None (no ambiguity - it's the actual result)
        self.assertTrue(all(r is None for r in results))
        self.assertEqual(work_count, 1)
        self.assertIn("key1", cache)
        self.assertIsNone(cache["key1"])

        # Subsequent call also gets None from cache
        result2 = await sf("key1", on_first=on_first, on_middle=on_middle)
        self.assertIsNone(result2)

    async def test_cleanup_after_work(self):
        """Lock is cleaned up after work completes."""
        cache = {}

        async def work():
            await asyncio.sleep(0.05)
            result = "result"
            cache["key1"] = result
            return result

        sf = SingleFlight[str, str]()

        # Do work
        await sf("key1", on_first=work, on_middle=lambda: cache["key1"])

        # Lock should be removed
        self.assertNotIn("key1", sf._in_progress)

        # Next call should do work again (not wait on stale lock)
        work_count = 0

        async def work2():
            nonlocal work_count
            work_count += 1
            result = "result2"
            cache["key1"] = result
            return result

        result = await sf("key1", on_first=work2, on_middle=lambda: cache["key1"])
        self.assertEqual(result, "result2")
        self.assertEqual(work_count, 1)

    async def test_cleanup_after_error(self):
        """Lock is cleaned up even when work raises exception."""
        cache = {}

        async def failing_work():
            await asyncio.sleep(0.05)
            raise ValueError("error")

        sf = SingleFlight[str, str]()

        # Do work that fails
        with self.assertRaises(ValueError):
            await sf("key1", on_first=failing_work, on_middle=lambda: cache["key1"])

        # Lock should be removed
        self.assertNotIn("key1", sf._in_progress)

        # Next call should do work again
        work_count = 0

        async def work2():
            nonlocal work_count
            work_count += 1
            result = "result"
            cache["key1"] = result
            return result

        result = await sf("key1", on_first=work2, on_middle=lambda: cache["key1"])
        self.assertEqual(result, "result")
        self.assertEqual(work_count, 1)

    async def test_contains(self):
        """Test __contains__ for checking in-progress operations."""
        cache = {}

        async def slow_work():
            await asyncio.sleep(0.1)
            result = "result"
            cache["key1"] = result
            return result

        sf = SingleFlight[str, str]()

        # Start work in background
        task = asyncio.create_task(
            sf("key1", on_first=slow_work, on_middle=lambda: cache["key1"])
        )
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
        cache = {}

        async def work(key: str):
            await asyncio.sleep(0.05)
            completed.append(key)
            result = f"result-{key}"
            cache[key] = result
            return result

        sf = SingleFlight[str, str]()

        # Start multiple operations
        asyncio.create_task(
            sf("key1", on_first=lambda: work("key1"), on_middle=lambda: cache["key1"])
        )
        asyncio.create_task(
            sf("key2", on_first=lambda: work("key2"), on_middle=lambda: cache["key2"])
        )
        asyncio.create_task(
            sf("key3", on_first=lambda: work("key3"), on_middle=lambda: cache["key3"])
        )
        await asyncio.sleep(0.01)  # Let them start

        # Wait for all to complete
        await sf.wait_all()

        # All should be done
        self.assertEqual(len(completed), 3)
        self.assertCountEqual(completed, ["key1", "key2", "key3"])
