import type { ChangeResponse, NodeResponse } from "$types/api";
import type { Node_, NodeMap, ChildrenMap } from "$types/filesystem";

function getParentId(rawNode: NodeResponse) {
  if (!rawNode) {
    return null;
  }
  if (!rawNode.parent_list) {
    return null;
  }
  if (rawNode.parent_list.length < 1) {
    return null;
  }
  return rawNode.parent_list[0];
}

export function createNode(rawNode: NodeResponse): Node_ {
  const node: Node_ = {
    id: rawNode.id,
    name: rawNode.name,
    isFolder: rawNode.is_folder,
    parentId: getParentId(rawNode),
    mimeType: rawNode.mime_type,
    category: rawNode.is_folder ? "folder" : rawNode.mime_type.split("/")[0],
    modified: Date.parse(rawNode.modified),
  };
  return node;
}

export function applyChange(
  nodeMap: NodeMap,
  childrenMap: ChildrenMap,
  change: ChangeResponse,
) {
  if (change.removed === true) {
    removeNode(nodeMap, childrenMap, change.id);
    return;
  }
  if (change.node.trashed) {
    removeNode(nodeMap, childrenMap, change.node.id);
    return;
  }
  upsertNode(nodeMap, childrenMap, change.node);
}

function removeNode(nodeMap: NodeMap, childrenMap: ChildrenMap, id: string) {
  const node = nodeMap[id];
  if (!node) {
    return;
  }
  if (!node.parentId) {
    throw new Error("invalid parent");
  }
  removeNodeFromParent(nodeMap, childrenMap, node.parentId, node.id);
  delete childrenMap[node.id];
  delete nodeMap[node.id];
}

function upsertNode(
  nodeMap: NodeMap,
  childrenMap: ChildrenMap,
  rawNode: NodeResponse,
) {
  const newNode = createNode(rawNode);
  const oldNode = nodeMap[rawNode.id];

  // this is a new node
  if (!oldNode) {
    if (!newNode.parentId) {
      throw new Error("invalid parent");
    }
    insertNodeToParent(nodeMap, childrenMap, newNode.parentId, newNode.id);
    // add the node only if its parent needs it
    if (childrenMap[newNode.parentId]) {
      nodeMap[newNode.id] = newNode;
    }
    return;
  }

  // this is an existing node, but moved to new position
  if (newNode.parentId !== oldNode.parentId) {
    if (!newNode.parentId || !oldNode.parentId) {
      throw new Error("invalid parent");
    }
    // remove child from old parent
    removeNodeFromParent(nodeMap, childrenMap, oldNode.parentId, oldNode.id);
    // insert to new parent
    insertNodeToParent(nodeMap, childrenMap, newNode.parentId, newNode.id);
  }

  // update node data
  nodeMap[newNode.id] = newNode;
}

function removeNodeFromParent(
  nodeMap: NodeMap,
  childrenMap: ChildrenMap,
  parentId: string,
  id: string,
) {
  const parentNode = nodeMap[parentId];
  if (!parentNode) {
    // the parent is not loaded into the view yet, nothing to update
    return;
  }
  const siblingList = childrenMap[parentId];
  if (!siblingList) {
    // the children is not loaded to the view yet
    return;
  }
  childrenMap[parentId] = siblingList.filter((siblingId) => siblingId !== id);
}

function insertNodeToParent(
  nodeMap: NodeMap,
  childrenMap: ChildrenMap,
  parentId: string,
  id: string,
) {
  const parentNode = nodeMap[parentId];
  if (!parentNode) {
    // the parent is not loaded into the view yet, nothing to update
    return;
  }
  const siblingList = childrenMap[parentId];
  if (!siblingList) {
    // the children is not loaded to the view yet
    return;
  }
  childrenMap[parentId].push(id);
}
