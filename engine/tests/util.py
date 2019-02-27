import asyncio as aio
import functools as ft
import unittest.mock as utm


def async_test(fn):
    @ft.wraps(fn)
    def wrapper(self, *args, **kwargs):
        return aio.run(fn(self, *args, **kwargs))
    return wrapper


def async_mock(return_value, *args, **kwargs):
    assert 'side_effect' not in kwargs
    fn = lambda *args, **kwargs: create_awaitable(return_value)
    return utm.Mock(side_effect=fn, *args, **kwargs)


def create_awaitable(rv):
    loop = aio.get_running_loop()
    f = loop.create_future()
    f.set_result(rv)
    return f
