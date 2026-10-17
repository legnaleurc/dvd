import json
from abc import abstractmethod
from typing import Any, NoReturn

from aiohttp.abc import AbstractView
from aiohttp.web import Response
from aiohttp.web_exceptions import HTTPNoContent


class PermissionMixin(AbstractView):
    async def check_permission(self) -> None:
        if not await self.has_permission():
            await self.raise_permission_error()

    @abstractmethod
    async def has_permission(self) -> bool: ...

    @abstractmethod
    async def raise_permission_error(self) -> NoReturn: ...


class RetrieveAPIMixin[T](PermissionMixin):
    async def get(self) -> Response:
        await self.check_permission()
        rv = await self.retrieve()
        return json_response(rv, status=200)

    @abstractmethod
    async def retrieve(self) -> T: ...


class ListAPIMixin[T](PermissionMixin):
    async def get(self) -> Response:
        await self.check_permission()
        rv = await self.list_()
        return json_response(rv, status=200)

    @abstractmethod
    async def list_(self) -> list[T]: ...


class PartialUpdateAPIMixin[T](PermissionMixin):
    async def patch(self) -> Response:
        await self.check_permission()
        rv = await self.partial_update()
        return json_response(rv, status=200)

    @abstractmethod
    async def partial_update(self) -> T: ...


class CreateAPIMixin[T](PermissionMixin):
    async def post(self) -> Response:
        await self.check_permission()
        rv = await self.create()
        return json_response(rv, status=201)

    @abstractmethod
    async def create(self) -> T: ...


class DestroyAPIMixin(PermissionMixin):
    async def delete(self) -> NoReturn:
        await self.check_permission()
        await self.destroy()
        raise HTTPNoContent()

    @abstractmethod
    async def destroy(self) -> None: ...


def json_response(data: Any, status: int = 200):
    data = json.dumps(data)
    return Response(
        status=status,
        content_type="application/json",
        text=data + "\n",
    )
