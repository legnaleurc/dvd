import {
  FS_ROOT_GET_TRY,
  FS_ROOT_GET_SUCCEED,
  FS_ROOT_GET_FAILED,
  FS_LIST_GET_TRY,
  FS_LIST_GET_SUCCEED,
  FS_LIST_GET_FAILED,
  FS_SYNC_TRY,
  FS_SYNC_SUCCEED,
  FS_SYNC_FAILED,
  FS_SET_SORT,
  FileSystemState,
  ActionTypes,
  SucceedGetRootAction,
  SucceedGetListAction,
  SucceedSyncAction,
  SetSortAction,
  Node,
  NodeDict,
} from './types';
import {
  SORT_BY_MTIME_DES,
  getCompareFunction,
} from './sort';
import {
  NodeResponse,
  ChangeResponse,
  RemovedChangeResponse,
  UpsertChangeResponse,
} from '../../lib';


const initialState: FileSystemState = {
  updating: false,
  nodes: {},
  rootId: null,
  sortKey: SORT_BY_MTIME_DES,
  // denotes the changes from the database point of view
  revision: 0,
};


export default function reduceFileSystem (
  state: FileSystemState = initialState,
  action: ActionTypes,
): FileSystemState {
  switch (action.type) {
    case FS_ROOT_GET_TRY: {
      return Object.assign({}, state, {
        updating: true,
      });
    }
    case FS_ROOT_GET_SUCCEED: {
      const { node: rawNode, children } = (action as SucceedGetRootAction).payload;

      const cmp = getCompareFunction(state.sortKey);
      const childNodes = children.map(createNode).sort(cmp);

      const node = createNode(rawNode);
      node.fetched = true;
      node.children = childNodes.map(node => node.id);
      const nodes = {
        [node.id]: node,
      };

      for (const node of childNodes) {
        nodes[node.id] = node;
      }

      // root changes means all data need reinitialize
      return Object.assign({}, state, {
        updating: false,
        nodes,
        rootId: node.id,
      });
    }
    case FS_ROOT_GET_FAILED: {
      return Object.assign({}, state, {
        updating: false,
      });
    }
    case FS_LIST_GET_TRY: {
      return Object.assign({}, state, {
        updating: true,
      });
    }
    case FS_LIST_GET_SUCCEED: {
      const { nodes, sortKey } = state;
      const { id, children } = (action as SucceedGetListAction).payload;

      const cmp = getCompareFunction(sortKey);
      const childNodes = children.map(createNode).sort(cmp);

      for (const node of childNodes) {
        nodes[node.id] = node;
      }

      const parent = nodes[id];
      nodes[id] = Object.assign({}, parent, {
        fetched: true,
        children: childNodes.map(node => node.id),
      });

      return Object.assign({}, state, {
        updating: false,
        nodes: Object.assign({}, nodes),
      });
    }
    case FS_LIST_GET_FAILED: {
      return Object.assign({}, state, {
        updating: false,
      });
    }
    case FS_SYNC_TRY: {
      return Object.assign({}, state, {
        updating: true,
      });
    }
    case FS_SYNC_SUCCEED: {
      const { nodes, sortKey, revision } = state;
      const { changeList } = (action as SucceedSyncAction).payload;
      const needSort = new Set<string>();
      for (const change of changeList) {
        applyChange(needSort, nodes, change);
      }
      const cmp = getCompareFunction(sortKey);
      for (const id of needSort) {
        const node = nodes[id];
        if (!node.children) {
          throw new Error('no children');
        }
        const children = node.children.map(id => nodes[id]);
        node.children = children.sort(cmp).map(node => node.id);
        nodes[id] = Object.assign({}, node);
      }
      return Object.assign({}, state, {
        updating: false,
        nodes: Object.assign({}, nodes),
        revision: revision + 1,
      });
    }
    case FS_SYNC_FAILED: {
      return Object.assign({}, state, {
        updating: false,
      });
    }
    case FS_SET_SORT: {
      const { nodes, rootId } = state;
      const { key } = (action as SetSortAction).payload;

      if (!rootId) {
        throw new Error('no root');
      }

      if (key === state.sortKey) {
        return state;
      }

      const cmp = getCompareFunction(key);
      deepSort(nodes, rootId, cmp);

      return Object.assign({}, state, {
        nodes: Object.assign({}, nodes),
        sortKey: key,
      });
    }
    default:
      return state;
  }
}


function createNode (node: NodeResponse): Node {
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


function applyChange (needSort: Set<string>, nodes: NodeDict, change: ChangeResponse) {
  if (change.removed) {
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

  // this is an existing node
  if (node.parentId !== newNode.parentId) {
    if (!node.parentId || !newNode.parentId) {
      throw new Error('invalid parent');
    }
    // remove child from old parent
    removeNodeFromParent(nodes, node.parentId, node.id);
    // insert to new parent
    insertNodeToParent(needSort, nodes, newNode.parentId, newNode.id);
  }
  nodes[newNode.id] = Object.assign({}, newNode);
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
  nodes[parentId] = Object.assign({}, parent, {
    children: parent.children.filter(id => id !== nodeId),
  });
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


function deepSort (nodes: NodeDict, id: string, cmp: (a: Node, b: Node) => number) {
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
