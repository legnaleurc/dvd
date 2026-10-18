from collections.abc import AsyncGenerator
from contextlib import AsyncExitStack, asynccontextmanager
from datetime import datetime
from logging import getLogger
from typing import Any

from wcpan.drive.core.exceptions import NodeNotFoundError
from wcpan.drive.core.types import ChangeAction, Drive, Node, ReadableFile

from .rest import ContentMetadata
from .types import ChangeDict, ImageDict, NodeDict


_L = getLogger(__name__)


class DownloadFailedError(Exception):
    pass


def json_decoder_hook(d: dict[str, Any]) -> Any:
    if "__type__" not in d or "__value__" not in d:
        return d

    match d["__type__"]:
        case "Node":
            return Node(**d["__value__"])
        case "datetime":
            return datetime.fromisoformat(d["__value__"])
        case _:
            return d


async def get_node(drive: Drive, id_or_root: str) -> Node | None:
    try:
        if id_or_root == "root":
            return await drive.get_root()
        else:
            return await drive.get_node_by_id(id_or_root)
    except NodeNotFoundError:
        return None


def dict_from_node(node: Node) -> NodeDict:
    return {
        "id": node.id,
        "name": node.name,
        "parent_id": node.parent_id,
        "is_trashed": node.is_trashed,
        "is_directory": node.is_directory,
        "changed_time": node.changed_time.isoformat(),
        "mime_type": node.mime_type,
        "hash": node.hash,
        "size": node.size,
    }


def dict_from_change(change: ChangeAction) -> ChangeDict:
    match change:
        case (True, id_):
            return {"removed": True, "id": id_}
        case (False, node):
            return {"removed": False, "node": dict_from_node(node)}


@asynccontextmanager
async def open_download(
    drive: Drive, node: Node, offset: int = 0
) -> AsyncGenerator[ReadableFile]:
    """
    Opens the download and starts the transfer, so the caller can still answer
    with an error status if the drive fails, before preparing its response.
    Raises DownloadFailedError if the drive fails to start the transfer.
    """
    async with AsyncExitStack() as stack:
        try:
            stream = await stack.enter_async_context(drive.download_file(node))
            await stream.seek(offset)
        except Exception as e:
            _L.exception(f"failed to download node {node.id}")
            raise DownloadFailedError(node.id) from e
        yield stream


def content_metadata_from_node(node: Node) -> ContentMetadata:
    """
    Raises IsADirectoryError if the node has no content to serve.
    """
    if node.is_directory:
        raise IsADirectoryError(node.id)
    assert node.size is not None
    return ContentMetadata(
        size=node.size,
        content_type=node.mime_type,
        etag=node.hash,
        last_modified=node.modified_time,
    )


def content_metadata_from_image(data: ImageDict) -> ContentMetadata:
    return ContentMetadata(
        size=data["size"],
        content_type=data["type"],
        etag=data["etag"],
        last_modified=data["modified_time"],
    )
