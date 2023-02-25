import os.path

from aiohttp.web import View, FileResponse, HTTPFound


class IndexView(View):
    async def get(self):
        path = self.request.app["static"]
        path = os.path.join(path, "index.html")
        return FileResponse(path=path)


class IndexRedirect(View):
    async def get(self):
        raise HTTPFound("/files")
