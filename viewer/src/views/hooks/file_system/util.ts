import {
  ChangeResponse,
  NodeResponse,
  RemovedChangeResponse,
  UpsertChangeResponse,
} from '@/lib';
import { Node_, NodeDict } from './types';


export function createNode (node: NodeResponse): Node_ {
  return {
    id: node.id,
    name: node.name,
    parentId: getParentId(node),
    modified: Date.parse(node.modified),
    mimeType: node.mime_type,
    children: node.is_folder ? [] : null,
    fetched: false,
  };
}


export function applyChange (needSort: Set<string>, nodes: NodeDict, change: ChangeResponse) {
  if (change.removed === true) {
    const rcr = (change as RemovedChangeResponse);
    removeNode(nodes, rcr.id);
    return;
  }
  const ucr = change as UpsertChangeResponse;
  if (ucr.node.trashed) {
    removeNode(nodes, ucr.node.id);
    return;
  }
  upsertNode(needSort, nodes, ucr.node);
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
  nodes[newNode.id] = {...newNode};
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
  if (!parent || !parent.fetched) {
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
  if (!parent || !parent.fetched) {
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


export function deepSort (nodes: NodeDict, id: string, cmp: (a: Node_, b: Node_) => number) {
  const node = nodes[id];
  if (!node) {
    return;
  }
  if (!node.fetched) {
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
