import os.path as op

import aiohttp.web as aw


class IndexView(aw.View):

    async def get(self):
        path = self.request.app['static']
        path = op.join(path, 'index.html')
        return aw.FileResponse(path=path)
