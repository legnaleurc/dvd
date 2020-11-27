from contextlib import AsyncExitStack
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import IsolatedAsyncioTestCase

from aiohttp.test_utils import TestServer, TestClient

from engine.main import application_context


class ViewTestCase(IsolatedAsyncioTestCase):

    async def asyncSetUp(self) -> None:
        await super().asyncSetUp()
        async with AsyncExitStack() as stack:
            static_path = stack.enter_context(TemporaryDirectory())
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
        await super().asyncTearDown()

    async def testCorrectRoutes(self):
        expected = 'test'

        index_path = self._static_path / 'index.html'
        with index_path.open('w') as fout:
            fout.write(expected)

        valid_routes = [
            '',
            'files',
            'settings',
            'search',
            'comic',
            'comic/abc',
        ]
        for route in valid_routes:
            rv = await self._client.get(f'/{route}')
            self.assertEqual(rv.status, 200)
            body = await rv.text()
            self.assertEqual(body, expected)

    async def testInvalidRoutes(self):
        rv = await self._client.get('/abc')
        self.assertEqual(rv.status, 404)

    async def testStaticUrl(self):
        expected = 'test'

        index_path = self._static_path / 'random.txt'
        with index_path.open('w') as fout:
            fout.write(expected)

        rv = await self._client.get('/static/random.txt')
        self.assertEqual(rv.status, 200)
        body = await rv.text()
        self.assertEqual(body, expected)
