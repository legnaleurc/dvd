import { call, put, takeEvery, select } from 'redux-saga/effects';

import { getSearch } from '../selectors';


const SEARCH_NAME_PRE = 'SEARCH_NAME_PRE';
export const SEARCH_NAME_TRY = 'SEARCH_NAME_TRY';
export const SEARCH_NAME_SUCCEED = 'SEARCH_NAME_SUCCEED';
export const SEARCH_NAME_FAILED = 'SEARCH_NAME_FAILED';
export const SEARCH_COMPARE_TRY = 'SEARCH_COMPARE_TRY';
export const SEARCH_COMPARE_SUCCEED = 'SEARCH_COMPARE_SUCCEED';
export const SEARCH_COMPARE_FAILED = 'SEARCH_COMPARE_FAILED';


export function getSearchName (name) {
  return {
    type: SEARCH_NAME_PRE,
    payload: {
      name,
    },
  };
}


function getSearchNameTry (name) {
  return {
    type: SEARCH_NAME_TRY,
    payload: {
      name,
    },
  };
}


function getSearchNameSucceed (pathList) {
  return {
    type: SEARCH_NAME_SUCCEED,
    payload: {
      pathList,
    },
  };
}


function getSearchNameFailed (message) {
  return {
    type: SEARCH_NAME_FAILED,
    payload: {
      message,
    },
  };
}


export function * sagaGetSearchName (fileSystem) {
  yield takeEvery(SEARCH_NAME_PRE, function * ({ payload }) {
    try {
      const { loading } = yield select(getSearch);
      if (loading) {
        return;
      }

      const { name } = payload;
      yield put(getSearchNameTry(name));

      const pathList = yield call(() => fileSystem.searchByName(name));
      yield put(getSearchNameSucceed(pathList));
    } catch (e) {
      yield put(getSearchNameFailed(e.message));
    }
  });
}


export function compare (idList) {
  return {
    type: SEARCH_COMPARE_TRY,
    payload: {
      idList,
    },
  };
}


function compareSucceed () {
  return {
    type: SEARCH_COMPARE_SUCCEED,
  };
}


function compareFailed (sizeList) {
  return {
    type: SEARCH_COMPARE_FAILED,
    payload: {
      sizeList,
    },
  };
}


export function * sagaCompare () {
  yield takeEvery(SEARCH_COMPARE_TRY, function * ({ payload }) {
    const { idList } = payload;
    if (idList.length <= 0) {
      return;
    }

    const { dict } = yield select(getSearch);
    const md5List = idList.map(id => dict[id].md5);
    const rv = md5List.slice(1).every(md5 => md5 === md5List[0]);
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
