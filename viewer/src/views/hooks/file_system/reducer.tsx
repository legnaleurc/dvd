import React from 'react';

import {
  ActionType,
  FetchState,
  NodeDict,
  SORT_BY_MTIME_DES,
  SortKey,
} from './types';
import { getCompareFunction } from './sort';
import { applyChange, createNode, deepSort } from './util';


interface IState {
  syncing: boolean;
  nodes: NodeDict;
  rootId: string | null;
  sortKey: SortKey;
  // denotes the changes from the database point of view
  revision: number;
}


function reduce (state: IState, action: ActionType) {
  switch (action.type) {
    case 'ERROR':
      return {
        ...state,
        syncing: false,
      };
    case 'REQUEST_BEGIN':
      return {
        ...state,
        syncing: true,
      };
    case 'NODE_REQUEST_BEGIN': {
      const { nodes } = state;
      const id = action.value;
      nodes[id] = {
        ...nodes[id],
        fetchState: FetchState.LOADING,
      };
      return {
        ...state,
      };
    }
    case 'SYNC_END': {
      const { nodes, sortKey, revision } = state;
      const changeList = action.value;
      const needSort = new Set<string>();
      for (const change of changeList) {
        applyChange(needSort, nodes, change);
      }
      const cmp = getCompareFunction(sortKey);
      for (const id of needSort) {
        const node = nodes[id];
        if (!node) {
          // the parent is not loaded into the view yet, nothing to update
          continue;
        }
        if (!node.children) {
          // all node in this set should be folder, this is an error
          throw new Error('no children');
        }
        const children = node.children.map(id => nodes[id]);
        node.children = children.sort(cmp).map(node => node.id);
        nodes[id] = { ...node };
      }
      return {
        ...state,
        syncing: false,
        nodes: { ...nodes },
        revision: revision + 1,
      };
    }
    case 'LOAD_ROOT_END': {
      const { rawNode, children } = action.value;
      const cmp = getCompareFunction(state.sortKey);
      const childNodes = children.map(createNode).sort(cmp);

      const node = createNode(rawNode);
      node.fetchState = FetchState.FULL;
      node.children = childNodes.map(node => node.id);
      const nodes = {
        [node.id]: node,
      };

      for (const node of childNodes) {
        nodes[node.id] = node;
      }

      // root changes means all data need to be flushed
      return {
        ...state,
        syncing: false,
        nodes,
        rootId: node.id,
        revision: state.revision + 1,
      };
    }
    case 'LOAD_LIST_END': {
      const { nodes, sortKey } = state;
      const { id, children } = action.value;

      const cmp = getCompareFunction(sortKey);
      const childNodes = children.map(createNode).sort(cmp);

      for (const node of childNodes) {
        nodes[node.id] = node;
      }

      const parent = nodes[id];
      nodes[id] = {
        ...parent,
        fetchState: FetchState.FULL,
        children: childNodes.map(node => node.id),
      };

      return {
        ...state,
        syncing: false,
        nodes: { ...nodes },
      };
    }
    case 'SORT': {
      const { nodes, rootId } = state;
      const key = action.value;

      if (!rootId) {
        throw new Error('no root');
      }

      if (key === state.sortKey) {
        return state;
      }

      const cmp = getCompareFunction(key);
      deepSort(nodes, rootId, cmp);

      return {
        ...state,
        nodes: { ...nodes },
        sortKey: key,
      };
    }
    default:
      return state;
  }
}


export function useReducer () {
  return React.useReducer(reduce, {
    syncing: false,
    nodes: {},
    rootId: null,
    sortKey: SORT_BY_MTIME_DES,
    revision: 0,
  });
}
