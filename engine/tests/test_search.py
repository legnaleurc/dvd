import unittest as ut
import unittest.mock as utm

from engine.util import SearchEngine

from .util import async_test, async_mock


class SearchTest(ut.TestCase):

    def setUp(self):
        self._nodes = [
            utm.Mock(),
        ]
        self._drive = create_fake_drive(self._nodes)
        self._engine = SearchEngine(self._drive)

    @async_test
    async def testSearchSingleWord(self):
        nodes = await self._engine.get_nodes_by_regex(r'alice')
        self.assertIsNotNone(nodes)

    @async_test
    async def testSearchCache(self):
        await self._engine.get_nodes_by_regex(r'alice')
        await self._engine.get_nodes_by_regex(r'alice')
        self.assertEquals(self._drive.find_nodes_by_regex.call_count, 1)


def create_fake_drive(nodes):
    drive = utm.NonCallableMock()
    drive.find_nodes_by_regex = async_mock(return_value=nodes)
    return drive
