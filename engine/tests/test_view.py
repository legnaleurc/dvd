from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import IsolatedAsyncioTestCase
from unittest.mock import patch

from aiohttp.test_utils import TestClient, TestServer

from engine.main import _application_context


class ViewTestCase(IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        await super().asyncSetUp()

        static_path = self.enterContext(TemporaryDirectory())
        self.enterContext(patch("engine.main.create_drive_from_config"))
        app = await self.enterAsyncContext(
            _application_context(
                port=9999,
                unpack_path="",
                drive_path="drive_path",
                static_path=static_path,
                token="1234",
            )
        )
        client = await self.enterAsyncContext(TestClient(TestServer(app)))
        self._client = client
        self._static_path = Path(static_path)

    async def asyncTearDown(self) -> None:
        await super().asyncTearDown()

    async def testCorrectRoutes(self):
        expected = "test"

        index_path = self._static_path / "index.html"
        with index_path.open("w") as fout:
            fout.write(expected)

        valid_routes = [
            "",
            "files",
            "settings",
            "search",
            "comic",
            "comic/abc",
        ]
        for route in valid_routes:
            rv = await self._client.get(f"/{route}")
            self.assertEqual(rv.status, 200)
            body = await rv.text()
            self.assertEqual(body, expected)

    async def testInvalidRoutes(self):
        rv = await self._client.get("/abc")
        self.assertEqual(rv.status, 404)

    async def testStaticUrl(self):
        expected = "test"

        index_path = self._static_path / "random.txt"
        with index_path.open("w") as fout:
            fout.write(expected)

        rv = await self._client.get("/random.txt")
        self.assertEqual(rv.status, 200)
        body = await rv.text()
        self.assertEqual(body, expected)
