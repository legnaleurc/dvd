import { call, put, takeEvery, select } from 'redux-saga/effects';

import { getActionList } from '../../lib';
import { getFileSystem } from '../selectors';


export const FS_LIST_GET_TRY = 'FS_LIST_GET_TRY';
export const FS_LIST_GET_SUCCEED = 'FS_LIST_GET_SUCCEED';
export const FS_LIST_GET_FAILED = 'FS_LIST_GET_FAILED';
export const FS_ROOT_GET_TRY = 'FS_ROOT_GET_TRY';
export const FS_ROOT_GET_SUCCEED = 'FS_ROOT_GET_SUCCEED';
export const FS_ROOT_GET_FAILED = 'FS_ROOT_GET_FAILED';
export const FS_STREAM_URL = 'FS_STREAM_URL';
export const FS_SYNC_TRY = 'FS_SYNC_TRY';
export const FS_SYNC_SUCCEED = 'FS_SYNC_SUCCEED';
export const FS_SYNC_FAILED = 'FS_SYNC_FAILED';
export const FS_MOVE_TRY = 'FS_MOVE_TRY';
export const FS_MOVE_SUCCEED = 'FS_MOVE_SUCCEED';
export const FS_MOVE_FAILED = 'FS_MOVE_FAILED';
export const FS_TRASH_TRY = 'FS_TRASH_TRY';
export const FS_TRASH_SUCCEED = 'FS_TRASH_SUCCEED';
export const FS_TRASH_FAILED = 'FS_TRASH_FAILED';
export const FS_SET_SORT = 'FS_SET_SORT';
export const FS_OPEN_STREAM = 'FS_OPEN_STREAM';
export const FS_COPY_STREAM = 'FS_COPY_STREAM';
export const FS_DOWNLOAD_STREAM = 'FS_DOWNLOAD_STREAM';


export function getList (id) {
  return {
    type: FS_LIST_GET_TRY,
    payload: {
      id,
    },
  };
}


function getListSucceed (id, children) {
  return {
    type: FS_LIST_GET_SUCCEED,
    payload: {
      id,
      children,
    },
  };
}


function getListFailed (message) {
  return {
    type: FS_LIST_GET_FAILED,
    payload: {
      message,
    },
  };
}


export function * sagaGetList (fileSystem) {
  yield takeEvery(FS_LIST_GET_TRY, function * ({ payload }) {
    const { id } = payload;
    try {
      const children = yield call(() => fileSystem.list(id));
      yield put(getListSucceed(id, children));
    } catch (e) {
      yield put(getListFailed(e.message));
    }
  });
}


export function getRoot () {
  return {
    type: FS_ROOT_GET_TRY,
  };
}


function getRootSucceed (node, children) {
  return {
    type: FS_ROOT_GET_SUCCEED,
    payload: {
      node,
      children,
    },
  };
}


function getRootFailed (message) {
  return {
    type: FS_ROOT_GET_FAILED,
    payload: {
      message,
    },
  };
}


export function * sagaGetRoot (fileSystem) {
  yield takeEvery(FS_ROOT_GET_TRY, function * () {
    try {
      const node = yield call(() => fileSystem.root());
      const children = yield call(() => fileSystem.list(node.id));
      yield put(getRootSucceed(node, children));
    } catch (e) {
      yield put(getRootFailed(e.message));
    }
  });
}


export function postSync () {
  return {
    type: FS_SYNC_TRY,
  };
}


function postSyncSucceed (changeList) {
  return {
    type: FS_SYNC_SUCCEED,
    payload: {
      changeList,
    },
  };
}


function postSyncFailed (message) {
  return {
    type: FS_SYNC_FAILED,
    payload: {
      message,
    },
  };
}


export function * sagaPostSync (fileSystem) {
  yield takeEvery(FS_SYNC_TRY, function * () {
    try {
      const changeList = yield call(() => fileSystem.sync());
      yield put(postSyncSucceed(changeList));
    } catch (e) {
      yield put(postSyncFailed(e.message));
    }
  });
}


export function moveNodes (srcList, dst) {
  return {
    type: FS_MOVE_TRY,
    payload: {
      srcList,
      dst,
    },
  };
}


function moveNodesSucceed () {
  return {
    type: FS_MOVE_SUCCEED,
  };
}


function moveNodesFailed (message) {
  return {
    type: FS_MOVE_FAILED,
    payload: {
      message,
    },
  };
}


export function * sagaMoveNodes (fileSystem) {
  yield takeEvery(FS_MOVE_TRY, function * ({ payload }) {
    try {
      const { srcList, dst } = payload;
      yield call(() => fileSystem.move(srcList, dst));
      yield put(moveNodesSucceed());
    } catch (e) {
      yield put(moveNodesFailed(e.message));
    }
    yield put(postSync());
  });
}


export function setSortFunction (key) {
  return {
    type: FS_SET_SORT,
    payload: {
      key,
    },
  };
}


export function openStreamUrl (id) {
  return {
    type: FS_OPEN_STREAM,
    payload: {
      id,
    },
  };
}


export function * sagaOpenStreamUrl (fileSystem) {
  yield takeEvery(FS_OPEN_STREAM, function * ({ payload }) {
    const { id } = payload;
    const { nodes } = yield select(getFileSystem);
    const node = nodes[id];
    if (!node || !node.mimeType) {
      // TODO error
      return;
    }
    const url = yield call(() => fileSystem.stream(id, node.name));

    const actionList = getActionList();
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


export function copyStream (list) {
  return {
    type: FS_COPY_STREAM,
    payload: {
      list,
    },
  };
}


export function * sagaCopyStream (fileSystem) {
  yield takeEvery(FS_COPY_STREAM, function * ({ payload }) {
    const { list } = payload;
    if (list.length !== 1) {
      // TODO error message?
      return;
    }
    const id = list[0];

    const { nodes } = yield select(getFileSystem);
    const url = yield call(() => fileSystem.stream(id, nodes[id].name));

    yield call(() => navigator.clipboard.writeText(url));
  });
}


export function downloadStream (list) {
  return {
    type: FS_DOWNLOAD_STREAM,
    payload: {
      list,
    },
  };
}


export function * sagaDownloadStream (fileSystem) {
  yield takeEvery(FS_DOWNLOAD_STREAM, function * ({ payload }) {
    const { list } = payload;
    if (list.length !== 1) {
      // TODO error message?
      return;
    }
    const id = list[0];

    const url = yield call(() => fileSystem.download(id));

    window.open(url, '_blank');
  });
}


export function trashNodes (list) {
  return {
    type: FS_TRASH_TRY,
    payload: {
      list,
    },
  };
}


function trashNodesSucceed () {
  return {
    type: FS_TRASH_SUCCEED,
  };
}


function trashNodesFailed (message) {
  return {
    type: FS_TRASH_FAILED,
    payload: {
      message,
    },
  };
}


export function * sagaTrashNodes (fileSystem) {
  yield takeEvery(FS_TRASH_TRY, function * ({ payload }) {
    try {
      const { list } = payload;
      yield call(() => fileSystem.trash(list));
      yield put(trashNodesSucceed());
    } catch (e) {
      yield put(trashNodesFailed(e.message));
    }
    yield put(postSync());
  });
}
