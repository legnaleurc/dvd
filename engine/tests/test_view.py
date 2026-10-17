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
        self._static_path = Path(static_path)
        self._write("index.html", "index")
        self._write("_app/immutable/x.js", "js")
        self._write("assets/favicon.svg", "svg")

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

    async def asyncTearDown(self) -> None:
        await super().asyncTearDown()

    def _write(self, path: str, content: str) -> None:
        full_path = self._static_path / path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        with full_path.open("w") as fout:
            fout.write(content)

    async def testPages(self):
        routes = [
            "",
            "files",
            "settings",
            "search",
            "comic",
            "comic/abc",
            "video",
            "video/abc",
            "abc",
            "random.txt",
        ]
        for route in routes:
            with self.subTest(route=route):
                rv = await self._client.get(f"/{route}")
                self.assertEqual(rv.status, 200)
                body = await rv.text()
                self.assertEqual(body, "index")

    async def testUnknownApi(self):
        for route in ["api", "api/v1/unknown"]:
            with self.subTest(route=route):
                rv = await self._client.get(f"/{route}")
                self.assertEqual(rv.status, 404)

    async def testStaticFiles(self):
        expected = {
            "_app/immutable/x.js": "js",
            "assets/favicon.svg": "svg",
        }
        for route, content in expected.items():
            with self.subTest(route=route):
                rv = await self._client.get(f"/{route}")
                self.assertEqual(rv.status, 200)
                body = await rv.text()
                self.assertEqual(body, content)

    async def testMissingStaticFiles(self):
        for route in ["_app/missing.js", "assets/missing.svg"]:
            with self.subTest(route=route):
                rv = await self._client.get(f"/{route}")
                self.assertEqual(rv.status, 404)
