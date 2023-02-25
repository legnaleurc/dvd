import argparse
import asyncio
import signal
from contextlib import asynccontextmanager

from aiohttp.web import Application, AppRunner, TCPSite
from wcpan.drive.core.drive import DriveFactory
from wcpan.logger import setup as setup_logger, EXCEPTION

from . import api, util, view, search


class Daemon(object):
    def __init__(self):
        self._kwargs = None
        self._finished = None
        self._loggers = setup_logger(
            (
                "aiohttp",
                "wcpan.drive",
                "engine",
            ),
            "/tmp/engine.log",
        )

    async def __call__(self, args):
        self._kwargs = parse_args(args[1:])
        self._finished = asyncio.Event()
        loop = asyncio.get_running_loop()
        loop.add_signal_handler(signal.SIGINT, self._close)
        loop.add_signal_handler(signal.SIGTERM, self._close)
        try:
            return await self._main()
        except Exception as e:
            EXCEPTION("engine", e)
        return 1

    async def _main(self):
        assert self._kwargs is not None
        port: int = self._kwargs.port
        unpack_path: str = self._kwargs.unpack
        static_path: str = self._kwargs.static
        token: str = self._kwargs.token

        async with application_context(
            port=port, unpack_path=unpack_path, static_path=static_path, token=token
        ) as app, server_context(app, port):
            await self._until_finished()

        return 0

    async def _until_finished(self):
        assert self._finished is not None
        await self._finished.wait()

    def _close(self):
        assert self._finished is not None
        self._finished.set()


def parse_args(args):
    parser = argparse.ArgumentParser("engine")

    parser.add_argument("-p", "--port", required=True, type=int)
    parser.add_argument("-u", "--unpack", required=True, type=str)
    parser.add_argument("-s", "--static", type=str)
    parser.add_argument("-t", "--token", type=str, default="")

    args = parser.parse_args(args)

    return args


@asynccontextmanager
async def application_context(
    port: int,
    unpack_path: str,
    static_path: str,
    token: str,
):
    app = Application()

    # api
    setup_api_path(app)

    # static
    if static_path:
        app["static"] = static_path
        setup_static_path(app, static_path)

    # drive
    factory = DriveFactory()
    factory.load_config()

    # context
    async with factory() as drive, util.UnpackEngine(drive, port, unpack_path) as ue:
        app["drive"] = drive
        app["ue"] = ue
        app["se"] = search.SearchEngine(drive)
        app["token"] = token

        yield app


@asynccontextmanager
async def server_context(app: Application, port: int):
    log_format = "%s %r (%b) %Tfs"
    runner = AppRunner(app, access_log_format=log_format)
    await runner.setup()
    try:
        v4 = TCPSite(runner, host="127.1", port=port)
        await v4.start()
        v6 = TCPSite(runner, host="::1", port=port)
        await v6.start()
        yield
    finally:
        await v6.stop()
        await v4.stop()
        await runner.cleanup()


def setup_api_path(app: Application) -> None:
    app.router.add_view(r"/api/v1/nodes", api.NodeListView)
    app.router.add_view(r"/api/v1/nodes/{id}", api.NodeView)
    app.router.add_view(r"/api/v1/nodes/{id}/children", api.NodeChildrenView)
    app.router.add_view(r"/api/v1/nodes/{id}/stream", api.NodeStreamView)
    app.router.add_view(r"/api/v1/nodes/{id}/stream/{name}", api.NodeStreamView)
    app.router.add_view(r"/api/v1/nodes/{id}/download", api.NodeDownloadView)
    app.router.add_view(r"/api/v1/nodes/{id}/images", api.NodeImageListView)
    app.router.add_view(r"/api/v1/nodes/{id}/images/{image_id}", api.NodeImageView)
    app.router.add_view(r"/api/v1/nodes/{id}/videos", api.NodeVideoListView)
    app.router.add_view(r"/api/v1/changes", api.ChangesView)
    app.router.add_view(r"/api/v1/apply", api.ApplyView)
    app.router.add_view(r"/api/v1/cache", api.CacheView)


def setup_static_path(app: Application, path: str) -> None:
    app.router.add_view(r"/", view.IndexRedirect)
    app.router.add_view(r"/files", view.IndexView)
    app.router.add_view(r"/search", view.IndexView)
    app.router.add_view(r"/settings", view.IndexView)
    app.router.add_view(r"/comic", view.IndexView)
    app.router.add_view(r"/comic/{id}", view.IndexView)
    app.router.add_view(r"/video", view.IndexView)
    app.router.add_view(r"/video/{id}", view.IndexView)
    app.router.add_static(r"/", path)


main = Daemon()
