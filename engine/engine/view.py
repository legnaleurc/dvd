from aiohttp.web import View, FileResponse, HTTPFound

from .app import KEY_STATIC


class IndexView(View):
    async def get(self):
        path = self.request.app[KEY_STATIC]
        return FileResponse(path=path / "index.html")


class IndexRedirect(View):
    async def get(self):
        raise HTTPFound("/files")
