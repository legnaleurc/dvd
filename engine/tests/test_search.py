from datetime import datetime, timezone
from typing import cast
from unittest import IsolatedAsyncioTestCase
from unittest.mock import AsyncMock, Mock, NonCallableMock

from engine.search import SearchEngine, SearchParam
from engine.types import SearchNodeDict
from wcpan.drive.core.types import Node


class SearchTest(IsolatedAsyncioTestCase):
    def setUp(self):
        self._nodes = [
            cast(SearchNodeDict, Mock()),
        ]
        self._drive = create_fake_drive(self._nodes)
        self._engine = SearchEngine(self._drive)

    async def testSearchSingleWord(self):
        nodes = await self._engine(name=r"alice")
        self.assertIsNotNone(nodes)

    async def testSearchCache(self):
        await self._engine(name=r"alice")
        await self._engine(name=r"alice")
        self.assertEqual(self._drive.find_nodes_by_regex.call_count, 1)

    async def testInvalidateCacheByNode(self):
        # given
        await self._engine(name="CircleA (AuthorA)", fuzzy=True)
        await self._engine(name="CircleB (AuthorB)", fuzzy=True)

        # when
        self._engine.invalidate_cache_by_node(create_file("[CircleA] partial"))

        # then
        cache = get_internal_cache(self._engine)
        self.assertFalse(
            SearchParam(
                name="CircleA (AuthorA)", fuzzy=True, parent_path=None, size=None
            )
            in cache
        )
        self.assertTrue(
            SearchParam(
                name="CircleB (AuthorB)", fuzzy=True, parent_path=None, size=None
            )
            in cache
        )


def create_fake_drive(nodes: list[SearchNodeDict]):
    drive = NonCallableMock()
    drive.find_nodes_by_regex = AsyncMock(return_value=nodes)
    return drive


def get_internal_cache(engine: SearchEngine) -> dict[SearchParam, list[SearchNodeDict]]:
    return engine._cache  # type: ignore


def create_file(name: str) -> Node:
    return Node(
        id="",
        parent_id="",
        name=name,
        is_directory=True,
        is_trashed=False,
        ctime=datetime.now(timezone.utc),
        mtime=datetime.now(timezone.utc),
        mime_type="",
        hash="",
        size=0,
        is_image=False,
        is_video=False,
        width=0,
        height=0,
        ms_duration=0,
        private=None,
    )
