import asyncio
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import IsolatedAsyncioTestCase
from unittest.mock import AsyncMock, MagicMock, patch
from typing import cast, Any
from datetime import datetime

from aiohttp.test_utils import TestServer, TestClient
from wcpan.drive.core.types import Node
from wcpan.drive.core.exceptions import NodeNotFoundError

from engine.app import KEY_DRIVE, KEY_UNPACK_ENGINE
from engine.main import application_context
from engine.util import dict_from_node


class ApiTestCase(IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        await super().asyncSetUp()

        static_path = self.enterContext(TemporaryDirectory())
        self.enterContext(patch("engine.main.create_drive_from_config"))
        app = await self.enterAsyncContext(
            application_context(
                port=9999,
                unpack_path="fake_unpack",
                drive_path="fake_drive",
                static_path=static_path,
                token="1234",
            )
        )
        client = await self.enterAsyncContext(TestClient(TestServer(app)))
        self._client = client
        self._static_path = Path(static_path)

    async def asyncTearDown(self) -> None:
        await super().asyncTearDown()

    async def testChangeList(self):
        assert self._client.app

        expected = []

        drive = self._client.app[KEY_DRIVE]
        drive.sync = MagicMock(return_value=AsyncMock(side_effect=expected))

        rv = await self._client.post("/api/v1/changes")
        self.assertEqual(rv.status, 401)
        rv = await self._client.post(
            "/api/v1/changes",
            headers={
                "Authorization": f"Token 1234",
            },
        )
        self.assertEqual(rv.status, 200)
        body = await rv.json()
        self.assertEqual(body, expected)

    async def testGetRoot(self):
        assert self._client.app

        expected = make_node({})

        drive = self._client.app[KEY_DRIVE]
        aexpect(drive.get_root).return_value = expected

        rv = await self._client.get("/api/v1/nodes/root")
        self.assertEqual(rv.status, 401)
        rv = await self._client.get(
            "/api/v1/nodes/root",
            headers={
                "Authorization": f"Token 1234",
            },
        )
        self.assertEqual(rv.status, 200)
        body = await rv.json()
        self.assertEqual(body, dict_from_node(expected))

    async def testGetNode(self):
        assert self._client.app

        expected = make_node({})

        drive = self._client.app[KEY_DRIVE]
        aexpect(drive.get_node_by_id).return_value = expected

        rv = await self._client.get("/api/v1/nodes/1")
        self.assertEqual(rv.status, 401)
        rv = await self._client.get(
            "/api/v1/nodes/1",
            headers={
                "Authorization": f"Token 1234",
            },
        )
        self.assertEqual(rv.status, 200)
        body = await rv.json()
        self.assertEqual(body, dict_from_node(expected))
        aexpect(drive.get_node_by_id).assert_called_once_with("1")

    async def testGetNodeWith404(self):
        assert self._client.app

        drive = self._client.app[KEY_DRIVE]
        aexpect(drive.get_node_by_id).side_effect = NodeNotFoundError("1")

        rv = await self._client.get("/api/v1/nodes/1")
        self.assertEqual(rv.status, 401)
        rv = await self._client.get(
            "/api/v1/nodes/1",
            headers={
                "Authorization": f"Token 1234",
            },
        )
        self.assertEqual(rv.status, 404)

    async def testMoveNode(self):
        assert self._client.app

        async def fake_get_node_by_id(id: str):
            return make_node(
                {
                    "id": id,
                }
            )

        drive = self._client.app[KEY_DRIVE]
        drive.get_node_by_id = AsyncMock(wraps=fake_get_node_by_id)

        rv = await self._client.patch(
            "/api/v1/nodes/1",
            json={
                "parent_id": "2",
            },
        )
        self.assertEqual(rv.status, 401)
        rv = await self._client.patch(
            "/api/v1/nodes/1",
            json={
                "parent_id": "2",
            },
            headers={
                "Authorization": f"Token 1234",
            },
        )
        self.assertEqual(rv.status, 204)
        aexpect(drive.move).assert_called_once_with(
            make_node({"id": "1"}),
            new_parent=make_node({"id": "2"}),
            new_name=None,
        )

    async def testRenameNode(self):
        assert self._client.app

        async def fake_get_node_by_id(id: str):
            return make_node(
                {
                    "id": id,
                }
            )

        drive = self._client.app[KEY_DRIVE]
        drive.get_node_by_id = AsyncMock(wraps=fake_get_node_by_id)

        rv = await self._client.patch(
            "/api/v1/nodes/1",
            json={
                "name": "test",
            },
        )
        self.assertEqual(rv.status, 401)
        rv = await self._client.patch(
            "/api/v1/nodes/1",
            json={
                "name": "test",
            },
            headers={
                "Authorization": f"Token 1234",
            },
        )
        self.assertEqual(rv.status, 204)
        aexpect(drive.move).assert_called_once_with(
            make_node({"id": "1"}),
            new_parent=None,
            new_name="test",
        )

    async def testTrashNode(self):
        assert self._client.app

        async def fake_get_node_by_id(id: str):
            return make_node(
                {
                    "id": id,
                }
            )

        drive = self._client.app[KEY_DRIVE]
        drive.get_node_by_id = AsyncMock(wraps=fake_get_node_by_id)

        rv = await self._client.delete("/api/v1/nodes/1")
        self.assertEqual(rv.status, 401)
        rv = await self._client.delete(
            "/api/v1/nodes/1",
            headers={
                "Authorization": f"Token 1234",
            },
        )
        self.assertEqual(rv.status, 204)
        aexpect(drive.move).assert_called_once_with(
            make_node({"id": "1"}), trashed=True
        )

    async def testImageListForFolders(self):
        assert self._client.app

        async def fake_get_node_by_id(id: str):
            return make_node(
                {
                    "id": id,
                    "is_directory": True,
                }
            )

        async def fake_walk(node: Node):
            yield node, cast(list[Node], []), [
                make_node(
                    {
                        "id": "2",
                        "name": "image2",
                        "mime_type": "image/png",
                        "is_image": True,
                        "width": 640,
                        "height": 480,
                    }
                ),
                make_node(
                    {
                        "id": "3",
                        "name": "file3",
                        "mime_type": "text/plain",
                    }
                ),
            ]

        drive = self._client.app[KEY_DRIVE]
        drive.get_node_by_id = AsyncMock(wraps=fake_get_node_by_id)
        drive.walk = cast(AsyncMock, fake_walk)

        rv = await self._client.get("/api/v1/nodes/1/images")
        self.assertEqual(rv.status, 401)
        rv = await self._client.get(
            "/api/v1/nodes/1/images",
            headers={
                "Authorization": f"Token 1234",
            },
        )
        self.assertEqual(rv.status, 200)
        body = await rv.json()
        self.assertEqual(len(body), 1)
        self.assertEqual(
            body[0],
            {
                "width": 640,
                "height": 480,
            },
        )

    @patch("asyncio.create_subprocess_exec")
    async def testImageListForFiles(self, fake_create_process: MagicMock):
        assert self._client.app

        async def fake_get_node_by_id(id: str):
            return make_node(
                {
                    "id": id,
                    "is_directory": False,
                }
            )

        ue = self._client.app[KEY_UNPACK_ENGINE]
        tmp_path = ue._storage._path  # type: ignore
        fake_process = AsyncMock()
        fake_process.communicate.return_value = None, None
        fake_process.returncode = 0
        fake_create_process.return_value = fake_process
        drive = self._client.app[KEY_DRIVE]
        drive.get_node_by_id = AsyncMock(wraps=fake_get_node_by_id)

        rv = await self._client.get("/api/v1/nodes/1/images")
        self.assertEqual(rv.status, 401)
        rv = await self._client.get(
            "/api/v1/nodes/1/images",
            headers={
                "Authorization": f"Token 1234",
            },
        )
        self.assertEqual(rv.status, 200)
        body = await rv.json()
        self.assertEqual(len(body), 0)
        fake_create_process.assert_called_once_with(
            "fake_unpack",
            "9999",
            "1",
            str(tmp_path),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )


def aexpect(unknown: object) -> AsyncMock:
    return cast(AsyncMock, unknown)


def make_node(d: Any):
    from dataclasses import replace

    node = Node(
        id="",
        name="",
        parent_id=None,
        is_trashed=False,
        is_directory=False,
        ctime=datetime.fromisoformat("1900-01-01T00:00:00+00:00"),
        mtime=datetime.fromisoformat("1900-01-01T00:00:00+00:00"),
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
    node = replace(node, **d)
    return node
