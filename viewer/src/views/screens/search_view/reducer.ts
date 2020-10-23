import React from 'react';

import { SearchResponse } from '@/lib';
import {
  SearchState,
  ActionType,
  EntryDict,
  Entry,
  CompareResult,
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
      if (rv) {
        return {
          ...state,
          showCompareDialog: true,
          diff: [],
        };
      }
      const sizeList: CompareResult[] = idList.map(id => ({
        path: dict[id].path,
        size: dict[id].size,
      }));
      return {
        ...state,
        showCompareDialog: true,
        diff: sizeList,
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
    diff: null,
  });
}
