import argparse
import asyncio
import logging
import os.path as op
import signal

from aiohttp import web as aw
from wcpan.drive.core.drive import DriveFactory
from wcpan.logger import setup as setup_logger, INFO, EXCEPTION

from . import api, util, view


class Daemon(object):

    def __init__(self):
        self._kwargs = None
        self._finished = None
        self._loggers = setup_logger((
            'aiohttp',
            'wcpan.drive',
            'engine',
        ), '/tmp/engine.log')

    async def __call__(self, args):
        self._kwargs = parse_args(args[1:])
        self._finished = asyncio.Event()
        loop = asyncio.get_running_loop()
        loop.add_signal_handler(signal.SIGINT, self._close)
        loop.add_signal_handler(signal.SIGTERM, self._close)
        try:
            return await self._main()
        except Exception as e:
            EXCEPTION('engine', e)
        return 1

    async def _main(self):
        port = self._kwargs.listen
        unpack_path = self._kwargs.unpack
        static_path = self._kwargs.static
        app = aw.Application()

        setup_api_path(app)
        if static_path:
            app['static'] = static_path
            setup_static_path(app, static_path)

        factory = DriveFactory()

        async with factory() as drive, \
                   util.UnpackEngine(drive, port, unpack_path) as ue, \
                   ServerContext(app, port, {
                       'drive': drive,
                       'se': util.SearchEngine(drive),
                       'ue': ue,
                   }):
            await self._until_finished()

        return 0

    async def _until_finished(self):
        await self._finished.wait()

    def _close(self):
        self._finished.set()


class ServerContext(object):

    def __init__(self, app, port, context):
        log_format = '%s %r (%b) %Tfs'
        for k, v in context.items():
            app[k] = v
        self._runner = aw.AppRunner(app, access_log_format=log_format)
        self._port = port

    async def __aenter__(self):
        await self._runner.setup()
        site = aw.TCPSite(self._runner, port=self._port)
        await site.start()
        return self._runner

    async def __aexit__(self, exc_type, exc, tb):
        await self._runner.cleanup()


def parse_args(args):
    parser = argparse.ArgumentParser('engine')

    parser.add_argument('-l', '--listen', required=True, type=int)
    parser.add_argument('-u', '--unpack', required=True, type=str)
    parser.add_argument('-s', '--static', type=str)

    args = parser.parse_args(args)

    return args


def setup_api_path(app):
    app.router.add_view(r'/api/v1/nodes', api.NodeListView)
    app.router.add_view(r'/api/v1/nodes/{id}', api.NodeView)
    app.router.add_view(r'/api/v1/nodes/{id}/children', api.NodeChildrenView)
    app.router.add_view(r'/api/v1/nodes/{id}/stream', api.NodeStreamView)
    app.router.add_view(r'/api/v1/nodes/{id}/stream/{name}', api.NodeStreamView)
    app.router.add_view(r'/api/v1/nodes/{id}/download', api.NodeDownloadView)
    app.router.add_view(r'/api/v1/nodes/{id}/images', api.NodeImageListView)
    app.router.add_view(r'/api/v1/nodes/{id}/images/{image_id}', api.NodeImageView)
    app.router.add_view(r'/api/v1/changes', api.ChangesView)
    app.router.add_view(r'/api/v1/apply', api.ApplyView)


def setup_static_path(app, path):
    app.router.add_static(r'/static', path)
    app.router.add_view(r'/', view.IndexView)
    app.router.add_view(r'/{name}', view.IndexView)


main = Daemon()
