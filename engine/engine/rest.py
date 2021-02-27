import abc
import json

from aiohttp.web import Response
from aiohttp.web_exceptions import HTTPNoContent, HTTPUnauthorized


class PermissionMixin(abc.ABC):

    async def has_permission(self) -> bool:
        return True


class RetriveAPIMixin(PermissionMixin, abc.ABC):

    async def get(self):
        if not await self.has_permission():
            raise HTTPUnauthorized()
        rv = await self.retrive()
        return json_response(rv, status=200)

    @abc.abstractmethod
    async def retrive(self):
        ...


class ListAPIMixin(PermissionMixin, abc.ABC):

    async def get(self):
        if not await self.has_permission():
            raise HTTPUnauthorized()
        rv = await self.list_()
        return json_response(rv, status=200)

    @abc.abstractmethod
    async def list_(self):
        ...


class PartialUpdateAPIMixin(PermissionMixin, abc.ABC):

    async def patch(self):
        if not await self.has_permission():
            raise HTTPUnauthorized()
        rv = await self.partial_update()
        return json_response(rv, status=200)

    @abc.abstractmethod
    async def partial_update(self):
        ...


class CreateAPIMixin(PermissionMixin, abc.ABC):

    async def post(self):
        if not await self.has_permission():
            raise HTTPUnauthorized()
        rv = await self.create()
        return json_response(rv, status=201)

    @abc.abstractmethod
    async def create(self):
        ...


class DestroyAPIMixin(PermissionMixin, abc.ABC):

    async def delete(self):
        if not await self.has_permission():
            raise HTTPUnauthorized()
        await self.destory()
        raise HTTPNoContent()

    @abc.abstractmethod
    async def destory(self):
        ...


def json_response(data, status=200):
    data = json.dumps(data)
    return Response(
        status=status,
        content_type='application/json',
        text=data + '\n',
        headers={
            'Access-Control-Allow-Origin': '*',
        })
