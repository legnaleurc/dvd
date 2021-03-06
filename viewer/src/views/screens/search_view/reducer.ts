import React from 'react';

import { SearchResponse } from '@/lib';
import {
  SearchState,
  ActionType,
  EntryDict,
  Entry,
} from './types';


function reduce (state: SearchState, action: ActionType) {
  switch (action.type) {
    case 'ERROR':
      return {
        ...state,
        loading: false,
        dict: {},
        list: [],
      };
    case 'SEARCH_BEGIN': {
      if (state.loading) {
        return state;
      }
      const name = action.value;
      const history = state.history.filter(e => e !== name);
      history.unshift(name);
      return {
        ...state,
        loading: true,
        dict: {},
        list: [],
        history,
        revision: state.revision + 1,
      };
    }
    case 'SEARCH_END': {
      const pathList = action.value;
      const dict: EntryDict = {};
      const list: string[] = [];
      for (const entry of pathList) {
        dict[entry.id] = createEntry(entry);
        list.push(entry.id);
      }
      return {
        ...state,
        loading: false,
        dict,
        list,
        revision: state.revision + 1,
      };
    }
    case 'COMPARE_SHOW': {
      const idList = action.value;
      if (idList.length <= 0) {
        return state;
      }
      const dict = state.dict;
      const hashList = idList.map(id => dict[id].hash);
      const rv = hashList.slice(1).every(hash => hash === hashList[0]);
      return {
        ...state,
        showCompareDialog: true,
        compareList: idList,
        identical: rv,
      };
    }
    case 'COMPARE_HIDE':
      return {
        ...state,
        showCompareDialog: false,
      };
    default:
      return state;
  }
}


function createEntry (entry: SearchResponse): Entry {
  return {
    id: entry.id,
    name: entry.name,
    hash: entry.hash,
    size: entry.size,
    mimeType: entry.mime_type,
    modified: new Date(entry.modified),
    children: null,
    parentId: entry.parent_list[0],
    path: entry.path,
  };
}


export function useReducer () {
  return React.useReducer(reduce, {
    loading: false,
    revision: 0,
    dict: {},
    list: [],
    history: [],
    showCompareDialog: false,
    compareList: [],
    identical: false,
  });
}
