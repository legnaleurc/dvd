import { call, put, takeEvery, select } from 'redux-saga/effects';

import { getActionList, FileSystem, SearchResponse } from '../../lib';
import { getSearch } from '../selectors';
import {
  SEARCH_NAME_PRE,
  PreSearchNameAction,
  SEARCH_NAME_TRY,
  TrySearchNameAction,
  SEARCH_NAME_SUCCEED,
  SucceedSearchNameAction,
  SEARCH_NAME_FAILED,
  FailedSearchNameAction,
  SEARCH_COMPARE_TRY,
  TrySearchCompareAction,
  SEARCH_COMPARE_SUCCEED,
  SucceedSearchCompareAction,
  SEARCH_COMPARE_FAILED,
  FailedSearchCompareAction,
  CompareResult,
  SEARCH_OPEN_STREAM,
  OpenStreamAction,
  SearchState,
} from './types';


export function getSearchName (name: string): PreSearchNameAction {
  return {
    type: SEARCH_NAME_PRE,
    payload: {
      name,
    },
  };
}


function getSearchNameTry (name: string): TrySearchNameAction {
  return {
    type: SEARCH_NAME_TRY,
    payload: {
      name,
    },
  };
}


function getSearchNameSucceed (pathList: SearchResponse[]): SucceedSearchNameAction {
  return {
    type: SEARCH_NAME_SUCCEED,
    payload: {
      pathList,
    },
  };
}


function getSearchNameFailed (message: string): FailedSearchNameAction {
  return {
    type: SEARCH_NAME_FAILED,
    payload: {
      message,
    },
  };
}


export function * sagaGetSearchName (fileSystem: FileSystem) {
  yield takeEvery(SEARCH_NAME_PRE, function * (action: PreSearchNameAction) {
    try {
      const { loading } = (yield select(getSearch)) as SearchState;
      if (loading) {
        return;
      }

      const { name } = action.payload;
      yield put(getSearchNameTry(name));

      const pathList: SearchResponse[] = yield call(() => fileSystem.searchByName(name));
      yield put(getSearchNameSucceed(pathList));
    } catch (e) {
      yield put(getSearchNameFailed(e.message));
    }
  });
}


export function compare (idList: string[]): TrySearchCompareAction {
  return {
    type: SEARCH_COMPARE_TRY,
    payload: {
      idList,
    },
  };
}


function compareSucceed (): SucceedSearchCompareAction {
  return {
    type: SEARCH_COMPARE_SUCCEED,
    payload: null,
  };
}


function compareFailed (sizeList: CompareResult[]): FailedSearchCompareAction {
  return {
    type: SEARCH_COMPARE_FAILED,
    payload: {
      sizeList,
    },
  };
}


export function * sagaCompare () {
  yield takeEvery(SEARCH_COMPARE_TRY, function * (action: TrySearchCompareAction) {
    const { idList } = action.payload;
    if (idList.length <= 0) {
      return;
    }

    const { dict } = (yield select(getSearch)) as SearchState;
    const hashList = idList.map(id => dict[id].hash);
    const rv = hashList.slice(1).every(hash => hash === hashList[0]);
    if (rv) {
      yield put(compareSucceed());
      return;
    }

    const sizeList = idList.map(id => ({
      path: dict[id].path,
      size: dict[id].size,
    }));
    yield put(compareFailed(sizeList));
  });
}


export function openStreamUrl (id: string): OpenStreamAction {
  return {
    type: SEARCH_OPEN_STREAM,
    payload: {
      id,
    },
  };
}


export function * sagaOpenStreamUrlFromSearch (fileSystem: FileSystem) {
  yield takeEvery(SEARCH_OPEN_STREAM, function * (action: OpenStreamAction) {
    const { id } = action.payload;
    const { dict } = (yield select(getSearch)) as SearchState;
    const node = dict[id];
    if (!node || !node.mimeType) {
      // TODO error
      return;
    }
    const url: string = yield call(() => fileSystem.stream(id, node.name));

    const actionList = getActionList();
    if (!actionList) {
      return;
    }
    const [category, __] = node.mimeType.split('/');
    const command = actionList[category];
    if (!command) {
      // just no command
      return;
    }

    yield call(() => fileSystem.apply(command, {
      url,
    }));
  });
}
