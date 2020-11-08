from contextlib import AsyncExitStack
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import IsolatedAsyncioTestCase
from unittest.mock import AsyncMock, patch, Mock

from aiohttp.test_utils import TestServer, TestClient
from wcpan.drive.core.cache import Node

from engine.main import application_context


class ApiTestCase(IsolatedAsyncioTestCase):

    async def asyncSetUp(self) -> None:
        async with AsyncExitStack() as stack:
            static_path = stack.enter_context(TemporaryDirectory())
            stack.enter_context(patch('engine.main.DriveFactory'))
            app = await stack.enter_async_context(application_context(
                port=9999,
                unpack_path='',
                static_path=static_path,
            ))
            client = await stack.enter_async_context(TestClient(TestServer(app)))
            self._client = client
            self._static_path = Path(static_path)
            self._raii = stack.pop_all()

    async def asyncTearDown(self) -> None:
        await self._raii.aclose()

    async def testIndex(self):
        expected = 'test'

        index_path = self._static_path / 'index.html'
        with index_path.open('w') as fout:
            fout.write(expected)

        rv = await self._client.get('/')
        self.assertEqual(rv.status, 200)
        body = await rv.text()
        self.assertEqual(body, expected)

    async def testIndexFallback(self):
        expected = 'test'

        index_path = self._static_path / 'index.html'
        with index_path.open('w') as fout:
            fout.write(expected)

        rv = await self._client.get('/search')
        self.assertEqual(rv.status, 200)
        body = await rv.text()
        self.assertEqual(body, expected)

    async def testStaticUrl(self):
        expected = 'test'

        index_path = self._static_path / 'random.txt'
        with index_path.open('w') as fout:
            fout.write(expected)

        rv = await self._client.get('/static/random.txt')
        self.assertEqual(rv.status, 200)
        body = await rv.text()
        self.assertEqual(body, expected)

    async def testChangeList(self):
        expected = []

        drive = self._client.app['drive']
        drive.sync = Mock(return_value=AsyncMock(side_effect=expected))

        rv = await self._client.post('/api/v1/changes')
        self.assertEqual(rv.status, 200)
        body = await rv.json()
        self.assertEqual(body, expected)

    async def testGetRoot(self):
        expected = make_node_dict({})

        drive = self._client.app['drive']
        drive.get_root_node.return_value = Node.from_dict(expected)

        rv = await self._client.get('/api/v1/nodes/root')
        self.assertEqual(rv.status, 200)
        body = await rv.json()
        self.assertEqual(body, expected)

    async def testGetNode(self):
        expected = make_node_dict({})

        drive = self._client.app['drive']
        drive.get_node_by_id.return_value = Node.from_dict(expected)

        rv = await self._client.get('/api/v1/nodes/1')
        self.assertEqual(rv.status, 200)
        body = await rv.json()
        self.assertEqual(body, expected)
        drive.get_node_by_id.assert_called_once_with('1')

    async def testGetNodeWith404(self):
        drive = self._client.app['drive']
        drive.get_node_by_id.return_value = None

        rv = await self._client.get('/api/v1/nodes/1')
        self.assertEqual(rv.status, 404)

    async def testMoveNode(self):
        async def fake_get_node_by_id(id: str):
            return Node.from_dict(make_node_dict({
                'id': id,
            }))
        drive = self._client.app['drive']
        drive.get_node_by_id = AsyncMock(wraps=fake_get_node_by_id)

        rv = await self._client.patch('/api/v1/nodes/1', json={
            'parent_id': '2',
        })
        self.assertEqual(rv.status, 204)
        drive.rename_node.assert_called_once_with(
            Node.from_dict(make_node_dict({ 'id': '1' })),
            Node.from_dict(make_node_dict({ 'id': '2' })),
            None,
        )


def make_node_dict(d):
    rv = {
        'id': '',
        'name': '',
        'trashed': False,
        'created': '1900-01-01T00:00:00+00:00',
        'modified': '1900-01-01T00:00:00+00:00',
        'is_folder': False,
        'mime_type': '',
        'hash': '',
        'size': 0,
        'image': None,
        'video': None,
        'parent_list': [],
        'private': None,
    }
    rv.update(d)
    return rv
