import re

from aiohttp.abc import AbstractView
from aiohttp.web_exceptions import (
    HTTPBadRequest,
    HTTPNotFound,
    HTTPUnauthorized,
)
from wcpan.drive.core.types import Node

from .app import KEY_DRIVE, KEY_TOKEN
from .lib import get_node
from .rest import PermissionMixin


class NodeObjectMixin(AbstractView):
    async def get_object(self) -> Node:
        id_ = self.request.match_info.get("id", None)
        if not id_:
            raise HTTPBadRequest()

        drive = self.request.app[KEY_DRIVE]
        node = await get_node(drive, id_)
        if not node:
            raise HTTPNotFound()

        return node


class RequireTokenMixin(PermissionMixin):
    async def has_permission(self):
        token = self.request.app[KEY_TOKEN]
        if not token:
            return True
        authorization = self.request.headers.get("Authorization")
        if not authorization:
            return False
        rv = re.match(r"Token\s+(.+)", authorization)
        if not rv:
            return False
        return rv.group(1) == token

    async def raise_permission_error(self):
        raise HTTPUnauthorized(
            headers={
                "WWW-Authenticate": f"Token realm=api",
            }
        )
