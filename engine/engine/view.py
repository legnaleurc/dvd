from aiohttp.web import FileResponse, HTTPNotFound, View

from .app import KEY_STATIC


class IndexView(View):
    async def get(self):
        path: str = self.request.match_info["path"]

        # unknown api routes should never fall back to pages
        if path == "api" or path.startswith("api/"):
            raise HTTPNotFound()

        root = self.request.app[KEY_STATIC]
        return FileResponse(path=root / "index.html")
