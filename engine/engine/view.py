import os.path as op

from aiohttp.web import View, FileResponse


class IndexView(View):

    async def get(self):
        path = self.request.app['static']
        path = op.join(path, 'index.html')
        return FileResponse(path=path)
