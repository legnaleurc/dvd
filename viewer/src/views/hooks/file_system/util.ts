import { ChangeResponse, NodeResponse } from '@/lib';
import { Node_, NodeDict, SortFunction, FetchState } from './types';


export function createNode (node: NodeResponse): Node_ {
  return {
    id: node.id,
    name: node.name,
    parentId: getParentId(node),
    modified: Date.parse(node.modified),
    mimeType: node.mime_type,
    children: node.is_folder ? [] : null,
    fetchState: FetchState.EMPTY,
  };
}


export function applyChange (
  needSort: Set<string>,
  nodes: NodeDict,
  change: ChangeResponse,
) {
  if (change.removed === true) {
    removeNode(nodes, change.id);
    return;
  }
  if (change.node.trashed) {
    removeNode(nodes, change.node.id);
    return;
  }
  upsertNode(needSort, nodes, change.node);
}


function removeNode (nodes: NodeDict, nodeId: string) {
  const node = nodes[nodeId];
  if (!node) {
    return;
  }
  if (!node.parentId) {
    throw new Error('invalid parent');
  }
  removeNodeFromParent(nodes, node.parentId, node.id);
  delete nodes[node.id];
}


function upsertNode (
  needSort: Set<string>,
  nodes: NodeDict,
  rawNode: NodeResponse,
) {
  const newNode = createNode(rawNode);
  const node = nodes[newNode.id];

  // this is a new node
  if (!node) {
    if (!newNode.parentId) {
      throw new Error('invalid parent');
    }
    // if have parent and already fetched chilidren, need to update the list
    insertNodeToParent(needSort, nodes, newNode.parentId, newNode.id);
    nodes[newNode.id] = newNode;
    return;
  }

  // this is an existing node, but moved to new position
  if (node.parentId !== newNode.parentId) {
    if (!node.parentId || !newNode.parentId) {
      throw new Error('invalid parent');
    }
    // remove child from old parent
    removeNodeFromParent(nodes, node.parentId, node.id);
    // insert to new parent
    insertNodeToParent(needSort, nodes, newNode.parentId, newNode.id);
  }
  // update node content, but keep existing children
  nodes[newNode.id] = {
    ...newNode,
    children: node.children,
  };
  // sort for its parent because node data has been changed
  if (newNode.parentId) {
    needSort.add(newNode.parentId);
  }
}


function removeNodeFromParent (
  nodes: NodeDict,
  parentId: string,
  nodeId: string,
) {
  const parent = nodes[parentId];
  if (!parent || !isLoaded(parent)) {
    // the parent is not loaded into the view yet, nothing to update
    return;
  }
  if (!parent.children) {
    throw new Error('invalid node');
  }
  nodes[parentId] = {
    ...parent,
    children: parent.children.filter(id => id !== nodeId),
  };
}


function insertNodeToParent (
  needSort: Set<string>,
  nodes: NodeDict,
  parentId: string,
  nodeId: string,
) {
  const parent = nodes[parentId];
  if (!parent || !isLoaded(parent)) {
    // the parent is not loaded into the view yet, nothing to update
    return;
  }
  if (!parent.children) {
    throw new Error('invalid node');
  }
  // sort later
  parent.children.push(nodeId);
  needSort.add(parentId)
}


function getParentId (rawNode: NodeResponse) {
  const p = rawNode.parent_list;
  if (!p || p.length <= 0) {
    return null;
  }
  return p[0];
}


export function deepSort (nodes: NodeDict, id: string, cmp: SortFunction) {
  const node = nodes[id];
  if (!node) {
    return;
  }
  if (!isLoaded(node)) {
    return;
  }
  if (!node.children) {
    throw new Error('invalid node');
  }
  const children = node.children.map(id => nodes[id]);
  children.sort(cmp);
  nodes[id] = {
    ...node,
    children: children.map(node => node.id),
  };
  for (const node of children) {
    deepSort(nodes, node.id, cmp);
  }
}


export function isLoading (node: Node_) {
  return node.fetchState === FetchState.LOADING;
}


export function isLoaded (node: Node_) {
  return node.fetchState === FetchState.FULL;
}
