import argparse
import asyncio
from logging import captureWarnings, getLogger
from logging.config import dictConfig
import signal
from contextlib import asynccontextmanager
from pathlib import Path

from aiohttp.web import Application, AppRunner, TCPSite
from wcpan.drive.cli.lib import create_drive_from_config
from wcpan.logging import ConfigBuilder

from . import api, view, search
from .util import create_unpack_engine


class Daemon(object):
    def __init__(self):
        self._kwargs = None
        self._finished = None

    async def __call__(self, args: list[str]):
        self._kwargs = parse_args(args[1:])
        self._finished = asyncio.Event()
        loop = asyncio.get_running_loop()
        loop.add_signal_handler(signal.SIGINT, self._close)
        loop.add_signal_handler(signal.SIGTERM, self._close)
        try:
            return await self._main()
        except Exception:
            getLogger(__name__).exception("main function error")
        return 1

    async def _main(self):
        assert self._kwargs is not None
        port: int = self._kwargs.port
        unpack_path: str = self._kwargs.unpack
        drive_path: str = self._kwargs.drive
        static_path: str = self._kwargs.static
        token: str = self._kwargs.token
        ipv6: bool = self._kwargs.ipv6
        expose: bool = self._kwargs.expose
        log_path: str = self._kwargs.log_path

        setup_logging(Path(log_path))

        async with application_context(
            port=port,
            unpack_path=unpack_path,
            drive_path=drive_path,
            static_path=static_path,
            token=token,
        ) as app, server_context(
            app,
            port,
            ipv6=ipv6,
            expose=expose,
        ):
            await self._until_finished()

        return 0

    async def _until_finished(self):
        assert self._finished is not None
        await self._finished.wait()

    def _close(self):
        assert self._finished is not None
        self._finished.set()


def parse_args(args: list[str]):
    parser = argparse.ArgumentParser("engine")

    parser.add_argument("-p", "--port", required=True, type=int)
    parser.add_argument("-u", "--unpack", required=True, type=str)
    parser.add_argument("-d", "--drive", required=True, type=str)
    parser.add_argument("-s", "--static", type=str)
    parser.add_argument("-t", "--token", type=str, default="")
    parser.add_argument("-6", "--ipv6", action="store_true")
    parser.add_argument("--expose", action="store_true")
    parser.add_argument("--log-path", type=str, default="/tmp")

    kwargs = parser.parse_args(args)
    return kwargs


def setup_logging(log_path: Path):
    path = log_path / "engine.log"
    dictConfig(
        ConfigBuilder(path=path, rotate=True)
        .add("engine", level="D")
        .add("wcpan", level="I")
        .to_dict()
    )
    captureWarnings(True)


@asynccontextmanager
async def application_context(
    port: int,
    unpack_path: str,
    drive_path: str,
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
    config_path = Path(drive_path)

    # context
    async with create_drive_from_config(config_path) as drive, create_unpack_engine(
        drive, port, unpack_path
    ) as ue:
        app["drive"] = drive
        app["ue"] = ue
        app["se"] = search.SearchEngine(drive)
        app["token"] = token

        yield app


@asynccontextmanager
async def server_context(
    app: Application,
    port: int,
    ipv6: bool,
    expose: bool,
):
    log_format = "%s %r (%b) %Tfs"
    runner = AppRunner(app, access_log_format=log_format)
    await runner.setup()
    try:
        ip = "0.0.0.0" if expose else "127.1"
        v4 = TCPSite(runner, host=ip, port=port)
        await v4.start()
        if ipv6:
            ip = "::" if expose else "::1"
            v6 = TCPSite(runner, host=ip, port=port)
            await v6.start()
        yield
    finally:
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
