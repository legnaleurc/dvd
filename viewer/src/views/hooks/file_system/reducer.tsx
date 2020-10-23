import React from 'react';

import { SORT_BY_MTIME_DES, SortKey, NodeDict, ActionType } from './types';
import { getCompareFunction } from './sort';
import { applyChange, createNode, deepSort } from './util';


interface IState {
  updating: boolean;
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
        updating: false,
      };
    case 'SYNC_BEGIN':
      return {
        ...state,
        updating: true,
      };
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
        if (!node.children) {
          throw new Error('no children');
        }
        const children = node.children.map(id => nodes[id]);
        node.children = children.sort(cmp).map(node => node.id);
        nodes[id] = { ...node };
      }
      return {
        ...state,
        updating: false,
        nodes: Object.assign({}, nodes),
        revision: revision + 1,
      };
    }
    case 'LOAD_ROOT_BEGIN':
      return {
        ...state,
        updating: true,
      };
    case 'LOAD_ROOT_END': {
      const { rawNode, children } = action.value;
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
      return {
        ...state,
        updating: false,
        nodes,
        rootId: node.id,
      };
    }
    case 'LOAD_LIST_BEGIN':
      return {
        ...state,
        updating: true,
      };
    case 'LOAD_LIST_END': {
      const { nodes, sortKey } = state;
      const { id, children } = action.value;

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

      return {
        ...state,
        updating: false,
        nodes: { ...nodes },
      };
    }
    case 'RENAME_BEGIN':
      return {
        ...state,
        updating: true,
      };
    case 'RENAME_END':
      return {
        ...state,
        updating: false,
      };
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
    updating: false,
    nodes: {},
    rootId: null,
    sortKey: SORT_BY_MTIME_DES,
    revision: 0,
  });
}
