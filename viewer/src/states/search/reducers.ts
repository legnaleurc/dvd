import {
  SEARCH_NAME_TRY,
  SEARCH_NAME_SUCCEED,
  SEARCH_NAME_FAILED,
  SEARCH_COMPARE_TRY,
  SEARCH_COMPARE_SUCCEED,
  SEARCH_COMPARE_FAILED,
  SearchState,
  ActionTypes,
  TrySearchNameAction,
  SucceedSearchNameAction,
  Entry,
  EntryDict,
  FailedSearchCompareAction,
} from './types';
import { SearchResponse } from '../../lib';


const initialState: SearchState = {
  loading: false,
  dict: {},
  list: [],
  history: [],
  diff: null,
};


export default function reduceSearch (state: SearchState = initialState, action: ActionTypes) {
  switch (action.type) {
    case SEARCH_NAME_TRY: {
      if (state.loading) {
        return state;
      }
      const { name } = (action as TrySearchNameAction).payload;
      const history = state.history.filter(e => e !== name);
      history.unshift(name);
      return Object.assign({}, state, {
        loading: true,
        dict: {},
        list: [],
        history,
      });
    }
    case SEARCH_NAME_SUCCEED: {
      const { pathList } = (action as SucceedSearchNameAction).payload;
      const dict: EntryDict = {};
      const list: string[] = [];
      for (const entry of pathList) {
        dict[entry.id] = createEntry(entry);
        list.push(entry.id);
      }
      return Object.assign({}, state, {
        loading: false,
        dict,
        list,
      });
    }
    case SEARCH_NAME_FAILED: {
      return Object.assign({}, state, {
        loading: false,
        dict: {},
        list: [],
      });
    }
    case SEARCH_COMPARE_TRY: {
      return Object.assign({}, state, {
        diff: null,
      });
    }
    case SEARCH_COMPARE_SUCCEED: {
      return Object.assign({}, state, {
        diff: [],
      });
    }
    case SEARCH_COMPARE_FAILED: {
      const { sizeList } = (action as FailedSearchCompareAction).payload;
      return Object.assign({}, state, {
        diff: sizeList,
      });
    }
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
    path: entry.path,
  };
}
