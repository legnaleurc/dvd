from contextlib import AsyncExitStack
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import IsolatedAsyncioTestCase
from unittest.mock import patch

from aiohttp.test_utils import TestServer, TestClient

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
        index_path = self._static_path / 'index.html'
        with index_path.open('w') as fout:
            fout.write('test')
        rv = await self._client.get('/')
        self.assertEqual(rv.status, 200)
        body = await rv.text()
        self.assertEqual(body, 'test')

    async def testIndexFallback(self):
        index_path = self._static_path / 'index.html'
        with index_path.open('w') as fout:
            fout.write('test')
        rv = await self._client.get('/search')
        self.assertEqual(rv.status, 200)
        body = await rv.text()
        self.assertEqual(body, 'test')
