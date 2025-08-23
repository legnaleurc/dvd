from asyncio import Event, get_running_loop
from collections.abc import Callable, Coroutine
from contextlib import asynccontextmanager
from functools import wraps
from logging import captureWarnings, getLogger
from logging.config import dictConfig
from pathlib import Path

from aiohttp.web import Application, AppRunner, TCPSite
from wcpan.drive.cli.lib import create_drive_from_config
from wcpan.logging import ConfigBuilder

from . import api, search, view
from .app import KEY_DRIVE, KEY_SEARCH_ENGINE, KEY_STATIC, KEY_TOKEN, KEY_UNPACK_ENGINE
from .args import parse_args
from .unpack import create_unpack_engine


_L = getLogger(__name__)


def _catch_error(
    fn: Callable[[list[str]], Coroutine[None, None, int]],
) -> Callable[[list[str]], Coroutine[None, None, int]]:
    @wraps(fn)
    async def wrapper(args: list[str]) -> int:
        try:
            return await fn(args)
        except Exception:
            _L.exception("main function error")
            return 1

    return wrapper


@_catch_error
async def amain(args: list[str]) -> int:
    kwargs = parse_args(args)
    _setup_logging(Path(kwargs.log_path) if kwargs.log_path else None)
    finished = _setup_signals()

    async with (
        _application_context(
            port=kwargs.port,
            unpack_path=kwargs.unpack,
            drive_path=kwargs.drive,
            static_path=kwargs.static,
            token=kwargs.token,
        ) as app,
        _server_context(
            app,
            kwargs.port,
            ipv6=kwargs.ipv6,
            expose=kwargs.expose,
        ),
    ):
        await finished.wait()
    return 0


def _setup_logging(log_path: Path | None) -> None:
    dictConfig(
        ConfigBuilder(path=log_path, rotate=True, rotate_when="w6")
        .add("engine", level="D")
        .add("wcpan", level="I")
        .to_dict()
    )
    captureWarnings(True)


def _setup_signals() -> Event:
    import signal

    loop = get_running_loop()
    finished = Event()
    loop.add_signal_handler(signal.SIGINT, lambda: finished.set())
    loop.add_signal_handler(signal.SIGTERM, lambda: finished.set())
    return finished


@asynccontextmanager
async def _application_context(
    port: int,
    unpack_path: str,
    drive_path: str,
    static_path: str,
    token: str,
):
    app = Application()

    # api
    _setup_api_path(app)

    # static
    if static_path:
        app[KEY_STATIC] = Path(static_path)
        _setup_static_path(app, static_path)

    # drive
    config_path = Path(drive_path)

    # context
    async with (
        create_drive_from_config(config_path) as drive,
        create_unpack_engine(drive, port, unpack_path) as ue,
    ):
        app[KEY_DRIVE] = drive
        app[KEY_UNPACK_ENGINE] = ue
        app[KEY_SEARCH_ENGINE] = search.SearchEngine(drive)
        app[KEY_TOKEN] = token

        yield app


@asynccontextmanager
async def _server_context(
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


def _setup_api_path(app: Application) -> None:
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
    app.router.add_view(r"/api/v1/cache", api.CachesImagesView)
    app.router.add_view(r"/api/v1/caches/images", api.CachesImagesView)
    app.router.add_view(r"/api/v1/caches/searches", api.CachesSearchesView)
    app.router.add_view(r"/api/v1/history", api.HistoryView)


def _setup_static_path(app: Application, path: str) -> None:
    app.router.add_view(r"/", view.IndexRedirect)
    app.router.add_view(r"/files", view.IndexView)
    app.router.add_view(r"/search", view.IndexView)
    app.router.add_view(r"/settings", view.IndexView)
    app.router.add_view(r"/comic", view.IndexView)
    app.router.add_view(r"/comic/{id}", view.IndexView)
    app.router.add_view(r"/video", view.IndexView)
    app.router.add_view(r"/video/{id}", view.IndexView)
    app.router.add_static(r"/", path)
