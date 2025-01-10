import itertools
from logging import getLogger
import re
from asyncio import Condition, as_completed
from collections.abc import AsyncIterator, Callable, Iterator
from dataclasses import dataclass, asdict
from typing import cast
from pathlib import PurePath

from wcpan.drive.core.types import Node, Drive

from .lib import dict_from_node
from .types import SearchNodeDict


_MAX_HISTORY = 10
_L = getLogger(__name__)


@dataclass(frozen=True)
class SearchParam:
    name: str | None
    fuzzy: bool | None
    parent_path: str | None
    size: int | None

    def is_valid(self) -> bool:
        return (
            bool(self.name)
            or self.fuzzy is not None
            or bool(self.parent_path)
            or self.size is not None
        )

    def to_dict(self):
        return asdict(self)


class SearchFailedError(Exception):
    def __init__(self, message: str) -> None:
        self._message = message

    def __str__(self) -> str:
        return self._message


class InvalidPatternError(Exception):
    def __init__(self, message: str) -> None:
        self._message = message

    def __str__(self) -> str:
        return self._message


class SearchEngine(object):
    def __init__(self, drive: Drive) -> None:
        super(SearchEngine, self).__init__()
        # NOTE only takes a reference, not owning
        self._drive = drive
        self._cache: dict[SearchParam, list[SearchNodeDict]] = {}
        self._searching: dict[SearchParam, Condition] = {}
        self._history: dict[SearchParam, None] = {}

    @property
    def history(self) -> Iterator[SearchParam]:
        return reversed(self._history.keys())

    async def __call__(
        self,
        *,
        name: str | None = None,
        fuzzy: bool | None = None,
        parent_path: str | None = None,
        size: int | None = None,
    ) -> list[SearchNodeDict]:
        param = SearchParam(name=name, fuzzy=fuzzy, parent_path=parent_path, size=size)
        if not param.is_valid():
            raise SearchFailedError(f"empty search param")

        _L.info(f"search {param}")

        self._update_history(param)

        nodes = self._cache.get(param, None)
        if nodes is not None:
            return nodes

        if param in self._searching:
            lock = self._searching[param]
            return await self._wait_for_result(lock, param)

        return await self._guarded_search(param)

    async def clear_cache(self) -> None:
        while len(self._searching) > 0:
            _pattern, lock = next(iter(self._searching.items()))
            async with lock:
                await lock.wait()
        self._cache: dict[SearchParam, list[SearchNodeDict]] = {}

    def invalidate_cache_by_node(self, node: Node) -> None:
        keys = list(self._cache.keys())
        for k in keys:
            if k in self._searching:
                # Going to be updated.
                continue
            if is_node_match_param(node, k):
                del self._cache[k]
                _L.debug(f"invalided search param {k}")

    def _invalidate_cache_by_param(self, param: SearchParam) -> None:
        if param in self._cache:
            del self._cache[param]

    async def _wait_for_result(
        self, lock: Condition, param: SearchParam
    ) -> list[SearchNodeDict]:
        async with lock:
            await lock.wait()
        try:
            return self._cache[param]
        except KeyError:
            raise SearchFailedError(f"{param} canceled search")

    async def _guarded_search(self, param: SearchParam) -> list[SearchNodeDict]:
        lock = Condition()
        self._searching[param] = lock
        try:
            nodes = await self._pure_search(param)
            g = (_ for _ in nodes if not _.is_trashed)
            g = as_completed(self._make_item(_) for _ in g)
            results = [await _ for _ in g]
            nodes = sorted(results, key=lambda _: (_["parent_path"], _["name"]))
            self._cache[param] = nodes
            return nodes
        except Exception as e:
            _L.exception("search failed, abort")
            raise SearchFailedError(str(e))
        finally:
            del self._searching[param]
            async with lock:
                lock.notify_all()

    async def _make_item(self, node: Node) -> SearchNodeDict:
        assert node.parent_id
        parent_node = await self._drive.get_node_by_id(node.parent_id)
        assert parent_node
        parent_path = await self._drive.resolve_path(parent_node)
        rv = cast(SearchNodeDict, dict_from_node(node))
        rv["parent_path"] = str(parent_path)
        return rv

    async def _pure_search(self, param: SearchParam) -> list[Node]:
        name = param.name
        fuzzy = param.name
        parent_path = param.parent_path
        size = param.size

        if parent_path:
            parent_node = await self._drive.get_node_by_path(PurePath(parent_path))
        else:
            parent_node = None

        if not name:
            pattern = ""
        else:
            if fuzzy:
                pattern = to_fuzzy_search_pattern(name)
            else:
                pattern = to_normal_search_pattern(name)

        if parent_node:
            node_list = [
                node
                async for node in walk_node(
                    self._drive,
                    parent_node,
                    (
                        None
                        if pattern
                        else lambda n: re.match(pattern, n.name, re.I) is not None
                    ),
                )
            ]
        elif pattern:
            node_list = await self._drive.find_nodes_by_regex(pattern)
        else:
            raise SearchFailedError("invalid query")

        if size is not None:
            if size >= 0:
                g = filter(lambda n: n.size >= size, node_list)
            else:
                g = filter(lambda n: n.size <= size, node_list)
            node_list = list(g)

        return node_list

    def _update_history(self, param: SearchParam):
        if param in self._history:
            del self._history[param]
        self._history[param] = None

        if len(self._history) > _MAX_HISTORY:
            oldest = next(iter(self._history))
            del self._history[oldest]
            self._invalidate_cache_by_param(oldest)


def to_normal_search_pattern(raw: str) -> str:
    safe = re.escape(raw)
    return f".*{safe}.*"


def to_fuzzy_search_pattern(raw: str) -> str:
    rv = re.match(r"(.+?)\s*\((.+)\)", raw)
    if rv:
        rv = rv.groups()
    else:
        rv = (raw,)
    rv = map(inner_fuzzy_search_pattern, rv)
    rv = "|".join(rv)
    rv = f".*({rv}).*"
    return rv


def inner_fuzzy_search_pattern(raw: str) -> str:
    rv = re.split(r"(?:\s|-)+", raw)
    rv = map(re.escape, rv)
    rv = map(str, rv)
    rv = ".*".join(rv)
    return rv


async def walk_node(
    drive: Drive, root: Node, fn: Callable[[Node], bool] | None
) -> AsyncIterator[Node]:
    async for _, folders, files in drive.walk(root):
        for f in itertools.chain(folders, files):
            if not fn or fn(f):
                yield f


def is_node_match_param(node: Node, param: SearchParam) -> bool:
    name = param.name
    fuzzy = param.fuzzy

    if not name:
        return False

    pattern = to_fuzzy_search_pattern(name) if fuzzy else to_normal_search_pattern(name)
    rv = re.search(pattern, node.name, re.I)
    return rv is not None
