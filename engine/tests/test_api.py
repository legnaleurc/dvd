import asyncio
from datetime import datetime
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any, cast
from unittest import IsolatedAsyncioTestCase
from unittest.mock import AsyncMock, MagicMock, patch

from aiohttp.test_utils import TestClient, TestServer
from PIL import Image
from wcpan.drive.core.exceptions import NodeNotFoundError
from wcpan.drive.core.types import Node

from engine.app import KEY_DRIVE, KEY_UNPACK_ENGINE
from engine.lib import dict_from_node
from engine.main import _application_context


class ApiTestCase(IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        await super().asyncSetUp()

        static_path = self.enterContext(TemporaryDirectory())
        (Path(static_path) / "_app").mkdir()
        (Path(static_path) / "assets").mkdir()
        self.enterContext(patch("engine.main.create_drive_from_config"))
        app = await self.enterAsyncContext(
            _application_context(
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
        self.assertEqual(rv.headers["WWW-Authenticate"], "Token realm=api")
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

    async def testDownloadNode(self):
        assert self._client.app

        data = b"0123456789"
        node = make_node({"id": "1", "name": "a.zip", "size": len(data)})

        drive = self._client.app[KEY_DRIVE]
        aexpect(drive.get_node_by_id).return_value = node
        drive.download_file = MagicMock(
            side_effect=lambda _node: FakeReadableFile(data)
        )

        rv = await self._client.get("/api/v1/nodes/1/download")
        self.assertEqual(rv.status, 200)
        self.assertEqual(
            rv.headers["Content-Disposition"], 'attachment; filename="a.zip"'
        )
        self.assertEqual(await rv.read(), data)

        rv = await self._client.head("/api/v1/nodes/1/download")
        self.assertEqual(rv.status, 200)
        self.assertEqual(rv.headers["Content-Length"], str(len(data)))
        self.assertEqual(
            rv.headers["Content-Disposition"], 'attachment; filename="a.zip"'
        )

        rv = await self._client.get(
            "/api/v1/nodes/1/stream",
            headers={
                "Range": "bytes=2-5",
            },
        )
        self.assertEqual(rv.status, 206)
        self.assertEqual(rv.headers["Content-Range"], "bytes 2-5/10")
        self.assertEqual(await rv.read(), data[2:6])

    async def testStreamNodeRange(self):
        assert self._client.app

        data = b"0123456789"
        node = make_node({"id": "1", "name": "a.zip", "size": len(data)})

        drive = self._client.app[KEY_DRIVE]
        aexpect(drive.get_node_by_id).return_value = node
        drive.download_file = MagicMock(
            side_effect=lambda _node: FakeReadableFile(data)
        )

        # (Range, status, Content-Range, body)
        cases: list[tuple[str, int, str | None, bytes]] = [
            ("bytes=2-", 206, "bytes 2-9/10", data[2:]),
            ("bytes=-3", 206, "bytes 7-9/10", data[7:]),
            ("bytes=-100", 206, "bytes 0-9/10", data),
            ("bytes=8-100", 206, "bytes 8-9/10", data[8:]),
            ("bytes=9-9", 206, "bytes 9-9/10", data[9:]),
            ("bytes=10-", 416, "bytes */10", b""),
            ("bytes=10-20", 416, "bytes */10", b""),
            # invalid or unsupported ranges are ignored
            ("bytes=5-2", 200, None, data),
            ("bytes=0-1,4-5", 200, None, data),
            ("items=0-1", 200, None, data),
        ]
        for range_, status, content_range, body in cases:
            with self.subTest(range=range_):
                rv = await self._client.get(
                    "/api/v1/nodes/1/stream", headers={"Range": range_}
                )
                self.assertEqual(rv.status, status)
                self.assertEqual(rv.headers.get("Content-Range"), content_range)
                if status != 416:
                    self.assertEqual(await rv.read(), body)

    async def testStreamNodeNotModified(self):
        assert self._client.app

        data = b"0123456789"
        node = make_node({"id": "1", "name": "a.zip", "size": len(data), "hash": "abc"})

        drive = self._client.app[KEY_DRIVE]
        aexpect(drive.get_node_by_id).return_value = node
        drive.download_file = MagicMock(
            side_effect=lambda _node: FakeReadableFile(data)
        )

        rv = await self._client.head("/api/v1/nodes/1/stream")
        last_modified = rv.headers["Last-Modified"]

        # (headers, status)
        cases: list[tuple[dict[str, str], int]] = [
            ({"If-None-Match": '"abc"'}, 304),
            ({"If-None-Match": 'W/"abc"'}, 304),
            ({"If-None-Match": '"x", "abc"'}, 304),
            ({"If-None-Match": "*"}, 304),
            ({"If-None-Match": '"other"'}, 200),
            ({"If-Modified-Since": last_modified}, 304),
            ({"If-Modified-Since": "Mon, 01 Jan 1800 00:00:00 GMT"}, 200),
            # If-None-Match takes precedence over If-Modified-Since
            ({"If-None-Match": '"other"', "If-Modified-Since": last_modified}, 200),
            # 304 takes precedence over Range
            ({"If-None-Match": '"abc"', "Range": "bytes=2-5"}, 304),
        ]
        for path in ["/api/v1/nodes/1/stream", "/api/v1/nodes/1/download"]:
            for headers, status in cases:
                with self.subTest(path=path, headers=headers):
                    rv = await self._client.get(path, headers=headers)
                    self.assertEqual(rv.status, status)
                    self.assertEqual(rv.headers["ETag"], '"abc"')
                    self.assertEqual(rv.headers["Last-Modified"], last_modified)
                    if status == 304:
                        self.assertEqual(await rv.read(), b"")
                    else:
                        self.assertEqual(await rv.read(), data)

    async def testStreamNodeIfRange(self):
        assert self._client.app

        data = b"0123456789"
        node = make_node({"id": "1", "name": "a.zip", "size": len(data), "hash": "abc"})

        drive = self._client.app[KEY_DRIVE]
        aexpect(drive.get_node_by_id).return_value = node
        drive.download_file = MagicMock(
            side_effect=lambda _node: FakeReadableFile(data)
        )

        rv = await self._client.head("/api/v1/nodes/1/stream")
        self.assertEqual(rv.headers["ETag"], '"abc"')
        last_modified = rv.headers["Last-Modified"]

        cases: list[tuple[str, int]] = [
            (last_modified, 206),
            ("Mon, 01 Jan 2001 00:00:00 GMT", 200),
            ('"abc"', 206),
            ('W/"abc"', 200),
            ('"other"', 200),
        ]
        for if_range, status in cases:
            with self.subTest(if_range=if_range):
                rv = await self._client.get(
                    "/api/v1/nodes/1/stream",
                    headers={"Range": "bytes=2-5", "If-Range": if_range},
                )
                self.assertEqual(rv.status, status)
                self.assertEqual(await rv.read(), data[2:6] if status == 206 else data)

    async def testDownloadNodeWithDriveError(self):
        assert self._client.app

        node = make_node({"id": "1", "name": "a.zip", "size": 10})

        drive = self._client.app[KEY_DRIVE]
        aexpect(drive.get_node_by_id).return_value = node
        drive.download_file = MagicMock(
            side_effect=lambda _node: FakeReadableFile(
                b"", error=ConnectionRefusedError()
            )
        )

        for path in ["/api/v1/nodes/1/download", "/api/v1/nodes/1/stream"]:
            with self.assertLogs("engine.mixins", level="ERROR"):
                rv = await self._client.get(path)
            self.assertEqual(rv.status, 502)

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
        drive.move = AsyncMock(return_value=make_node({"id": "1", "parent_id": "2"}))

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
        self.assertEqual(rv.status, 200)
        aexpect(drive.move).assert_called_once_with(
            make_node({"id": "1"}),
            new_parent=make_node({"id": "2"}),
            new_name=None,
        )
        self.assertEqual(
            await rv.json(), dict_from_node(make_node({"id": "1", "parent_id": "2"}))
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
        drive.move = AsyncMock(return_value=make_node({"id": "1", "name": "test"}))

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
        self.assertEqual(rv.status, 200)
        aexpect(drive.move).assert_called_once_with(
            make_node({"id": "1"}),
            new_parent=None,
            new_name="test",
        )
        self.assertEqual(
            await rv.json(), dict_from_node(make_node({"id": "1", "name": "test"}))
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
        aexpect(drive.delete).assert_called_once_with(make_node({"id": "1"}))

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
            yield (
                node,
                cast(list[Node], []),
                [
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
                ],
            )

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

    @patch("engine.unpack.create_subprocess_exec")
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
            "http://localhost:9999/api/v1/nodes/1/stream",
            str(tmp_path / "0" / "1"),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

    async def testImageListForFilesWithMaxSizeReturnsScaledManifest(self):
        assert self._client.app

        node = make_node(
            {
                "id": "1",
                "is_directory": False,
                "hash": "etag-1",
            }
        )
        drive = self._client.app[KEY_DRIVE]
        drive.get_node_by_id = AsyncMock(return_value=node)

        ue = self._client.app[KEY_UNPACK_ENGINE]
        source_path = ue._storage.get_path("1", 0) / "page.jpg"  # type: ignore[attr-defined]
        ue._storage.set_cache(  # type: ignore[attr-defined]
            "1",
            0,
            [
                {
                    "id": str(source_path),
                    "type": "image/jpeg",
                    "size": 123,
                    "etag": "etag-1",
                    "modified_time": datetime.fromisoformat(
                        "1900-01-01T00:00:00+00:00"
                    ),
                    "width": 1920,
                    "height": 1080,
                }
            ],
        )

        rv = await self._client.get(
            "/api/v1/nodes/1/images?max_size=1024",
            headers={
                "Authorization": f"Token 1234",
            },
        )

        self.assertEqual(rv.status, 200)
        body = await rv.json()
        self.assertEqual(body, [{"width": 1024, "height": 576}])
        self.assertFalse(ue._storage.get_path("1", 1024).exists())  # type: ignore[attr-defined]

    async def testImageForFileCreatesLazyVariant(self):
        assert self._client.app

        node = make_node(
            {
                "id": "1",
                "is_directory": False,
                "hash": "etag-1",
            }
        )
        drive = self._client.app[KEY_DRIVE]
        drive.get_node_by_id = AsyncMock(return_value=node)

        ue = self._client.app[KEY_UNPACK_ENGINE]
        source_path = ue._storage.get_path("1", 0) / "page.jpg"  # type: ignore[attr-defined]
        source_path.parent.mkdir(parents=True, exist_ok=True)
        Image.new("RGB", (1920, 1080), color="red").save(
            source_path, format="JPEG", quality=85
        )
        ue._storage.set_cache(  # type: ignore[attr-defined]
            "1",
            0,
            [
                {
                    "id": str(source_path),
                    "type": "image/jpeg",
                    "size": source_path.stat().st_size,
                    "etag": "etag-1",
                    "modified_time": datetime.fromisoformat(
                        "1900-01-01T00:00:00+00:00"
                    ),
                    "width": 1920,
                    "height": 1080,
                }
            ],
        )

        rv = await self._client.get("/api/v1/nodes/1/images/0?max_size=1024")

        self.assertEqual(rv.status, 200)
        variant_path = ue._storage.get_path("1", 1024) / "page.jpg"  # type: ignore[attr-defined]
        self.assertTrue(variant_path.exists())
        with Image.open(source_path) as img:
            self.assertEqual(img.size, (1920, 1080))
        with Image.open(variant_path) as img:
            self.assertEqual(img.size, (1024, 576))
        self.assertIsNone(ue._storage.get_cache_or_none("1", 1024))  # type: ignore[attr-defined]

    async def testImageForFileMissingIndexReturns404(self):
        assert self._client.app

        node = make_node(
            {
                "id": "1",
                "is_directory": False,
                "hash": "etag-1",
            }
        )
        drive = self._client.app[KEY_DRIVE]
        drive.get_node_by_id = AsyncMock(return_value=node)

        ue = self._client.app[KEY_UNPACK_ENGINE]
        ue._storage.set_cache("1", 0, [])  # type: ignore[attr-defined]

        rv = await self._client.get("/api/v1/nodes/1/images/0?max_size=1024")

        self.assertEqual(rv.status, 404)

    async def testCacheImageListSkipsDeletedNodes(self):
        assert self._client.app

        async def fake_get_node_by_id(id: str):
            if id == "deleted":
                raise NodeNotFoundError(id)
            return make_node(
                {
                    "id": id,
                    "name": f"node-{id}",
                }
            )

        drive = self._client.app[KEY_DRIVE]
        drive.get_node_by_id = AsyncMock(wraps=fake_get_node_by_id)

        ue = self._client.app[KEY_UNPACK_ENGINE]
        ue._storage.set_cache(
            "alive",
            0,
            [  # type: ignore[attr-defined]
                {
                    "id": "image-1",
                    "type": "image/png",
                    "size": 123,
                    "etag": "etag-1",
                    "modified_time": datetime.fromisoformat(
                        "1900-01-01T00:00:00+00:00"
                    ),
                    "width": 640,
                    "height": 480,
                }
            ],
        )
        ue._storage.set_cache(
            "deleted",
            0,
            [  # type: ignore[attr-defined]
                {
                    "id": "image-2",
                    "type": "image/png",
                    "size": 456,
                    "etag": "etag-2",
                    "modified_time": datetime.fromisoformat(
                        "1900-01-01T00:00:00+00:00"
                    ),
                    "width": 800,
                    "height": 600,
                }
            ],
        )

        rv = await self._client.get(
            "/api/v1/caches/images",
            headers={
                "Authorization": "Token 1234",
            },
        )
        self.assertEqual(rv.status, 200)
        body = await rv.json()
        self.assertEqual(
            body,
            [
                {
                    "id": "alive",
                    "name": "node-alive",
                    "image_list": [
                        {
                            "width": 640,
                            "height": 480,
                        }
                    ],
                }
            ],
        )

    async def testCacheImageListPreservesOrderWhileSkippingDeletedNodes(self):
        assert self._client.app

        async def fake_get_node_by_id(id: str):
            if id == "first":
                await asyncio.sleep(0.02)
            if id == "deleted":
                await asyncio.sleep(0.01)
                raise NodeNotFoundError(id)
            return make_node(
                {
                    "id": id,
                    "name": f"node-{id}",
                }
            )

        drive = self._client.app[KEY_DRIVE]
        drive.get_node_by_id = AsyncMock(wraps=fake_get_node_by_id)

        ue = self._client.app[KEY_UNPACK_ENGINE]
        for id_ in ["first", "deleted", "second"]:
            ue._storage.set_cache(
                id_,
                0,
                [  # type: ignore[attr-defined]
                    {
                        "id": f"image-{id_}",
                        "type": "image/png",
                        "size": 123,
                        "etag": f"etag-{id_}",
                        "modified_time": datetime.fromisoformat(
                            "1900-01-01T00:00:00+00:00"
                        ),
                        "width": 640,
                        "height": 480,
                    }
                ],
            )

        rv = await self._client.get(
            "/api/v1/caches/images",
            headers={
                "Authorization": "Token 1234",
            },
        )
        self.assertEqual(rv.status, 200)
        body = await rv.json()
        self.assertEqual([_["id"] for _ in body], ["first", "second"])


class FakeReadableFile:
    def __init__(self, data: bytes, *, error: Exception | None = None) -> None:
        self._data = data
        self._error = error
        self._offset = 0

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_: Any) -> None:
        pass

    async def seek(self, offset: int) -> int:
        if self._error:
            raise self._error
        self._offset = offset
        return offset

    async def __aiter__(self):
        yield self._data[self._offset :]


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
        created_time=datetime.fromisoformat("1900-01-01T00:00:00+00:00"),
        modified_time=datetime.fromisoformat("1900-01-01T00:00:00+00:00"),
        changed_time=datetime.fromisoformat("1900-01-01T00:00:00+00:00"),
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
