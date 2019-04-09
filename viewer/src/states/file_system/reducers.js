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
} from './actions';
import {
  SORT_BY_MTIME_DES,
  getCompareFunction,
} from './sort';


const initialState = {
  updating: false,
  nodes: {},
  rootId: null,
  sortKey: SORT_BY_MTIME_DES,
  // denotes the changes from the database point of view
  revision: 0,
};


export default function reduceFileSystem (state = initialState, { type, payload }) {
  switch (type) {
    case FS_ROOT_GET_TRY: {
      return Object.assign({}, state, {
        updating: true,
      });
    }
    case FS_ROOT_GET_SUCCEED: {
      let { node, children } = payload;

      const cmp = getCompareFunction(state.sortKey);
      children = children.map(createNode).sort(cmp);

      node = createNode(node);
      node.fetched = true;
      node.children = children.map(node => node.id);
      const nodes = {
        [node.id]: node,
      };

      for (const node of children) {
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
      const { id } = payload;
      let { children } = payload;

      const cmp = getCompareFunction(sortKey);
      children = children.map(createNode).sort(cmp);

      for (const node of children) {
        nodes[node.id] = node;
      }

      const parent = nodes[id];
      nodes[id] = Object.assign({}, parent, {
        fetched: true,
        children: children.map(node => node.id),
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
      const { changeList } = payload;
      const needSort = new Set();
      for (const change of changeList) {
        applyChange(needSort, nodes, change);
      }
      const cmp = getCompareFunction(sortKey);
      for (const id of needSort) {
        const node = nodes[id];
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
      const { key } = payload;

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


function createNode (node) {
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


function applyChange (needSort, nodes, change) {
  if (change.removed) {
    removeNode(nodes, change.id);
    return;
  }
  if (change.node.trashed) {
    removeNode(nodes, change.node.id);
    return;
  }
  upsertNode(needSort, nodes, change.node);
}


function removeNode (nodes, nodeId) {
  const node = nodes[nodeId];
  if (!node) {
    return;
  }
  removeNodeFromParent(nodes, node.parentId, node.id);
  delete nodes[node.id];
}


function upsertNode (needSort, nodes, node) {
  const newNode = createNode(node);
  node = nodes[node.id];

  // this is a new node
  if (!node) {
    // if have parent and already fetched chilidren, need to update the list
    insertNodeToParent(needSort, nodes, newNode.parentId, newNode.id);
    nodes[newNode.id] = newNode;
    return;
  }

  // this is an existing node
  if (node.parentId !== newNode.parentId) {
    // remove child from old parent
    removeNodeFromParent(nodes, node.parentId, node.id);
    // insert to new parent
    insertNodeToParent(needSort, nodes, newNode.parentId, newNode.id);
  }
  nodes[newNode.id] = Object.assign({}, newNode);
}


function removeNodeFromParent (nodes, parentId, nodeId) {
  const parent = nodes[parentId];
  if (!parent || !parent.fetched) {
    return;
  }
  nodes[parentId] = Object.assign({}, parent, {
    children: parent.children.filter(id => id !== nodeId),
  });
}


function insertNodeToParent (needSort, nodes, parentId, nodeId) {
  const parent = nodes[parentId];
  if (!parent || !parent.fetched) {
    return;
  }
  // sort later
  parent.children.push(nodeId);
  needSort.add(parentId)
}


function getParentId (rawNode) {
  let p = rawNode.parent_id;
  if (p) {
    return p;
  }
  p = rawNode.parent_list;
  if (!p || p.length <= 0) {
    return null;
  }
  return p[0];
}


function deepSort (nodes, id, cmp) {
  const node = nodes[id];
  if (!node) {
    return;
  }
  if (!node.fetched) {
    return;
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
