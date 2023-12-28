import json
from abc import ABCMeta, abstractmethod
from typing import Any

from aiohttp.web import Response
from aiohttp.web_exceptions import HTTPNoContent


class PermissionMixin(metaclass=ABCMeta):
    async def has_permission(self) -> bool:
        return True

    @abstractmethod
    async def raise_permission_error(self):
        ...


class RetriveAPIMixin(PermissionMixin, metaclass=ABCMeta):
    async def get(self):
        if not await self.has_permission():
            await self.raise_permission_error()
        rv = await self.retrive()
        return json_response(rv, status=200)

    @abstractmethod
    async def retrive(self):
        ...


class ListAPIMixin(PermissionMixin, metaclass=ABCMeta):
    async def get(self):
        if not await self.has_permission():
            await self.raise_permission_error()
        rv = await self.list_()
        return json_response(rv, status=200)

    @abstractmethod
    async def list_(self):
        ...


class PartialUpdateAPIMixin(PermissionMixin, metaclass=ABCMeta):
    async def patch(self):
        if not await self.has_permission():
            await self.raise_permission_error()
        rv = await self.partial_update()
        return json_response(rv, status=200)

    @abstractmethod
    async def partial_update(self):
        ...


class CreateAPIMixin(PermissionMixin, metaclass=ABCMeta):
    async def post(self):
        if not await self.has_permission():
            await self.raise_permission_error()
        rv = await self.create()
        return json_response(rv, status=201)

    @abstractmethod
    async def create(self):
        ...


class DestroyAPIMixin(PermissionMixin, metaclass=ABCMeta):
    async def delete(self):
        if not await self.has_permission():
            await self.raise_permission_error()
        await self.destory()
        raise HTTPNoContent()

    @abstractmethod
    async def destory(self):
        ...


def json_response(data: Any, status: int = 200):
    data = json.dumps(data)
    return Response(
        status=status,
        content_type="application/json",
        text=data + "\n",
    )
