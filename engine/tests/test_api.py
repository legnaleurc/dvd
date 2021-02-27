import asyncio
from contextlib import AsyncExitStack
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import IsolatedAsyncioTestCase
from unittest.mock import AsyncMock, MagicMock, patch
from typing import cast

from aiohttp.test_utils import TestServer, TestClient
from wcpan.drive.core.types import Node, NodeDict

from engine.main import application_context


class ApiTestCase(IsolatedAsyncioTestCase):

    async def asyncSetUp(self) -> None:
        await super().asyncSetUp()
        async with AsyncExitStack() as stack:
            static_path = stack.enter_context(TemporaryDirectory())
            stack.enter_context(patch('engine.main.DriveFactory'))
            app = await stack.enter_async_context(application_context(
                port=9999,
                unpack_path='fake_unpack',
                static_path=static_path,
                token='1234',
            ))
            client = await stack.enter_async_context(TestClient(TestServer(app)))
            self._client = client
            self._static_path = Path(static_path)
            self._raii = stack.pop_all()

    async def asyncTearDown(self) -> None:
        await self._raii.aclose()
        await super().asyncTearDown()

    async def testChangeList(self):
        expected = []

        drive = self._client.app['drive']
        drive.sync = MagicMock(return_value=AsyncMock(side_effect=expected))

        rv = await self._client.post('/api/v1/changes')
        self.assertEqual(rv.status, 401)
        rv = await self._client.post('/api/v1/changes', headers={
            'Authorization': f'Token 1234',
        })
        self.assertEqual(rv.status, 200)
        body = await rv.json()
        self.assertEqual(body, expected)

    async def testGetRoot(self):
        expected = make_node_dict({})

        drive = self._client.app['drive']
        drive.get_root_node.return_value = Node.from_dict(expected)

        rv = await self._client.get('/api/v1/nodes/root')
        self.assertEqual(rv.status, 401)
        rv = await self._client.get('/api/v1/nodes/root', headers={
            'Authorization': f'Token 1234',
        })
        self.assertEqual(rv.status, 200)
        body = await rv.json()
        self.assertEqual(body, expected)

    async def testGetNode(self):
        expected = make_node_dict({})

        drive = self._client.app['drive']
        drive.get_node_by_id.return_value = Node.from_dict(expected)

        rv = await self._client.get('/api/v1/nodes/1')
        self.assertEqual(rv.status, 401)
        rv = await self._client.get('/api/v1/nodes/1', headers={
            'Authorization': f'Token 1234',
        })
        self.assertEqual(rv.status, 200)
        body = await rv.json()
        self.assertEqual(body, expected)
        drive.get_node_by_id.assert_called_once_with('1')

    async def testGetNodeWith404(self):
        drive = self._client.app['drive']
        drive.get_node_by_id.return_value = None

        rv = await self._client.get('/api/v1/nodes/1')
        self.assertEqual(rv.status, 401)
        rv = await self._client.get('/api/v1/nodes/1', headers={
            'Authorization': f'Token 1234',
        })
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
        self.assertEqual(rv.status, 401)
        rv = await self._client.patch(
            '/api/v1/nodes/1',
            json={
                'parent_id': '2',
            },
            headers={
                'Authorization': f'Token 1234',
            },
        )
        self.assertEqual(rv.status, 204)
        drive.rename_node.assert_called_once_with(
            Node.from_dict(make_node_dict({ 'id': '1' })),
            Node.from_dict(make_node_dict({ 'id': '2' })),
            None,
        )

    async def testRenameNode(self):
        async def fake_get_node_by_id(id: str):
            return Node.from_dict(make_node_dict({
                'id': id,
            }))
        drive = self._client.app['drive']
        drive.get_node_by_id = AsyncMock(wraps=fake_get_node_by_id)

        rv = await self._client.patch('/api/v1/nodes/1', json={
            'name': 'test',
        })
        self.assertEqual(rv.status, 401)
        rv = await self._client.patch(
            '/api/v1/nodes/1',
            json={
                'name': 'test',
            },
            headers={
                'Authorization': f'Token 1234',
            },
        )
        self.assertEqual(rv.status, 204)
        drive.rename_node.assert_called_once_with(
            Node.from_dict(make_node_dict({ 'id': '1' })),
            None,
            'test',
        )

    async def testTrashNode(self):
        async def fake_get_node_by_id(id: str):
            return Node.from_dict(make_node_dict({
                'id': id,
            }))
        drive = self._client.app['drive']
        drive.get_node_by_id = AsyncMock(wraps=fake_get_node_by_id)

        rv = await self._client.delete('/api/v1/nodes/1')
        self.assertEqual(rv.status, 401)
        rv = await self._client.delete('/api/v1/nodes/1', headers={
            'Authorization': f'Token 1234',
        })
        self.assertEqual(rv.status, 204)
        drive.trash_node.assert_called_once_with(
            Node.from_dict(make_node_dict({ 'id': '1' })),
        )

    async def testImageListForFolders(self):
        async def fake_get_node_by_id(id: str):
            return Node.from_dict(make_node_dict({
                'id': id,
                'is_folder': True,
            }))
        async def fake_walk(node: Node):
            yield node, [], [
                Node.from_dict(make_node_dict({
                    'id': '2',
                    'name': 'image2',
                    'mime_type': 'image/png',
                    'image': {
                        'width': 640,
                        'height': 480,
                    },
                })),
                Node.from_dict(make_node_dict({
                    'id': '3',
                    'name': 'file3',
                    'mime_type': 'text/plain',
                })),
            ]

        drive = self._client.app['drive']
        drive.get_node_by_id = AsyncMock(wraps=fake_get_node_by_id)
        drive.walk = fake_walk

        rv = await self._client.get('/api/v1/nodes/1/images')
        self.assertEqual(rv.status, 401)
        rv = await self._client.get('/api/v1/nodes/1/images', headers={
            'Authorization': f'Token 1234',
        })
        self.assertEqual(rv.status, 200)
        body = await rv.json()
        self.assertEqual(len(body), 1)
        self.assertEqual(body[0], {
            'width': 640,
            'height': 480,
        })

    @patch('asyncio.create_subprocess_exec')
    async def testImageListForFiles(self, fake_create_process: MagicMock):
        async def fake_get_node_by_id(id: str):
            return Node.from_dict(make_node_dict({
                'id': id,
                'is_folder': False,
            }))

        ue = self._client.app['ue']
        tmp_path = ue._storage._tmp
        fake_process = AsyncMock()
        fake_process.communicate.return_value = None, None
        fake_process.returncode = 0
        fake_create_process.return_value = fake_process
        drive = self._client.app['drive']
        drive.get_node_by_id = AsyncMock(wraps=fake_get_node_by_id)

        rv = await self._client.get('/api/v1/nodes/1/images')
        self.assertEqual(rv.status, 401)
        rv = await self._client.get('/api/v1/nodes/1/images', headers={
            'Authorization': f'Token 1234',
        })
        self.assertEqual(rv.status, 200)
        body = await rv.json()
        self.assertEqual(len(body), 0)
        fake_create_process.assert_called_once_with(
            'fake_unpack', '9999', '1', tmp_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
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
    return cast(NodeDict, rv)
