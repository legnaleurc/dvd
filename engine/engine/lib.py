from wcpan.drive.core.types import Node, Drive, ChangeAction
from wcpan.drive.core.exceptions import NodeNotFoundError
from wcpan.drive.core.lib import dispatch_change

from .types import NodeDict


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
        "mtime": node.mtime.isoformat(),
        "mime_type": node.mime_type,
        "hash": node.hash,
        "size": node.size,
    }


def dict_from_change(change: ChangeAction):
    return dispatch_change(
        change,
        on_remove=lambda _: {
            "removed": True,
            "id": _,
        },
        on_update=lambda _: {
            "removed": False,
            "node": dict_from_node(_),
        },
    )
