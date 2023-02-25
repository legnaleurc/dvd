from unittest import IsolatedAsyncioTestCase
from unittest.mock import AsyncMock, Mock, NonCallableMock

from engine.search import SearchEngine


class SearchTest(IsolatedAsyncioTestCase):

    def setUp(self):
        self._nodes = [
            Mock(),
        ]
        self._drive = create_fake_drive(self._nodes)
        self._engine = SearchEngine(self._drive)

    async def testSearchSingleWord(self):
        nodes = await self._engine(name=r'alice')
        self.assertIsNotNone(nodes)

    async def testSearchCache(self):
        await self._engine(name=r'alice')
        await self._engine(name=r'alice')
        self.assertEqual(self._drive.find_nodes_by_regex.call_count, 1)


def create_fake_drive(nodes):
    drive = NonCallableMock()
    drive.find_nodes_by_regex = AsyncMock(return_value=nodes)
    return drive
