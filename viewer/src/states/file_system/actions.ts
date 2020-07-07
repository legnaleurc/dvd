import { call, put, takeEvery, select } from 'redux-saga/effects';

import {
  getActionList,
  FileSystem,
  NodeResponse,
  ChangeResponse,
} from '../../lib';
import { getFileSystem } from '../selectors';
import {
  FS_LIST_GET_TRY,
  TryGetListAction,
  FS_LIST_GET_SUCCEED,
  SucceedGetListAction,
  FS_LIST_GET_FAILED,
  FailedGetListAction,
  FS_ROOT_GET_TRY,
  TryGetRootAction,
  FS_ROOT_GET_SUCCEED,
  SucceedGetRootAction,
  FS_ROOT_GET_FAILED,
  FailedGetRootAction,
  FS_SYNC_TRY,
  TrySyncAction,
  FS_SYNC_SUCCEED,
  SucceedSyncAction,
  FS_SYNC_FAILED,
  FailedSyncAction,
  FS_MOVE_TRY,
  TryMoveAction,
  FS_MOVE_SUCCEED,
  SucceedMoveAction,
  FS_MOVE_FAILED,
  FailedMoveAction,
  FS_TRASH_TRY,
  TryTrashAction,
  FS_TRASH_SUCCEED,
  SucceedTrashAction,
  FS_TRASH_FAILED,
  FailedTrashAction,
  FS_SET_SORT,
  SetSortAction,
  FS_OPEN_STREAM,
  OpenStreamAction,
  FS_COPY_STREAM,
  CopyStreamAction,
  FS_DOWNLOAD_STREAM,
  DownloadStreamAction,
  FileSystemState,
} from './types';


export function getList (id: string): TryGetListAction {
  return {
    type: FS_LIST_GET_TRY,
    payload: {
      id,
    },
  };
}


function getListSucceed (id: string, children: NodeResponse[]): SucceedGetListAction {
  return {
    type: FS_LIST_GET_SUCCEED,
    payload: {
      id,
      children,
    },
  };
}


function getListFailed (message: string): FailedGetListAction {
  return {
    type: FS_LIST_GET_FAILED,
    payload: {
      message,
    },
  };
}


export function * sagaGetList (fileSystem: FileSystem) {
  yield takeEvery(FS_LIST_GET_TRY, function * (action: TryGetListAction) {
    const { id } = action.payload;
    try {
      const children: NodeResponse[] = yield call(() => fileSystem.list(id));
      yield put(getListSucceed(id, children));
    } catch (e) {
      yield put(getListFailed(e.message));
    }
  });
}


export function getRoot (): TryGetRootAction {
  return {
    type: FS_ROOT_GET_TRY,
    payload: null,
  };
}


function getRootSucceed (
  node: NodeResponse,
  children: NodeResponse[],
): SucceedGetRootAction {
  return {
    type: FS_ROOT_GET_SUCCEED,
    payload: {
      node,
      children,
    },
  };
}


function getRootFailed (message: string): FailedGetRootAction {
  return {
    type: FS_ROOT_GET_FAILED,
    payload: {
      message,
    },
  };
}


export function * sagaGetRoot (fileSystem: FileSystem) {
  yield takeEvery(FS_ROOT_GET_TRY, function * () {
    try {
      const node: NodeResponse = yield call(() => fileSystem.root());
      const children: NodeResponse[] = yield call(() => fileSystem.list(node.id));
      yield put(getRootSucceed(node, children));
    } catch (e) {
      yield put(getRootFailed(e.message));
    }
  });
}


export function postSync (): TrySyncAction {
  return {
    type: FS_SYNC_TRY,
    payload: null,
  };
}


function postSyncSucceed (changeList: ChangeResponse[]): SucceedSyncAction {
  return {
    type: FS_SYNC_SUCCEED,
    payload: {
      changeList,
    },
  };
}


function postSyncFailed (message: string): FailedSyncAction {
  return {
    type: FS_SYNC_FAILED,
    payload: {
      message,
    },
  };
}


export function * sagaPostSync (fileSystem: FileSystem) {
  yield takeEvery(FS_SYNC_TRY, function * () {
    try {
      const changeList: ChangeResponse[] = yield call(() => fileSystem.sync());
      yield put(postSyncSucceed(changeList));
    } catch (e) {
      yield put(postSyncFailed(e.message));
    }
  });
}


export function moveNodes (srcList: string[], dst: string): TryMoveAction {
  return {
    type: FS_MOVE_TRY,
    payload: {
      srcList,
      dst,
    },
  };
}


function moveNodesSucceed (): SucceedMoveAction {
  return {
    type: FS_MOVE_SUCCEED,
    payload: null,
  };
}


function moveNodesFailed (message: string): FailedMoveAction {
  return {
    type: FS_MOVE_FAILED,
    payload: {
      message,
    },
  };
}


export function * sagaMoveNodes (fileSystem: FileSystem) {
  yield takeEvery(FS_MOVE_TRY, function * (action: TryMoveAction) {
    try {
      const { srcList, dst } = action.payload;
      yield call(() => fileSystem.move(srcList, dst));
      yield put(moveNodesSucceed());
    } catch (e) {
      yield put(moveNodesFailed(e.message));
    }
    yield put(postSync());
  });
}


export function trashNodes (list: string[]): TryTrashAction {
  return {
    type: FS_TRASH_TRY,
    payload: {
      list,
    },
  };
}


function trashNodesSucceed (): SucceedTrashAction {
  return {
    type: FS_TRASH_SUCCEED,
    payload: null,
  };
}


function trashNodesFailed (message: string): FailedTrashAction {
  return {
    type: FS_TRASH_FAILED,
    payload: {
      message,
    },
  };
}


export function * sagaTrashNodes (fileSystem: FileSystem) {
  yield takeEvery(FS_TRASH_TRY, function * (action: TryTrashAction) {
    try {
      const { list } = action.payload;
      yield call(() => fileSystem.trash(list));
      yield put(trashNodesSucceed());
    } catch (e) {
      yield put(trashNodesFailed(e.message));
    }
    yield put(postSync());
  });
}


export function setSortFunction (key: string): SetSortAction {
  return {
    type: FS_SET_SORT,
    payload: {
      key,
    },
  };
}


export function openStreamUrl (id: string): OpenStreamAction {
  return {
    type: FS_OPEN_STREAM,
    payload: {
      id,
    },
  };
}


export function * sagaOpenStreamUrl (fileSystem: FileSystem) {
  yield takeEvery(FS_OPEN_STREAM, function * (action: OpenStreamAction) {
    const { id } = action.payload;
    const { nodes } = (yield select(getFileSystem)) as FileSystemState;
    const node = nodes[id];
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


export function copyStream (list: string[]): CopyStreamAction {
  return {
    type: FS_COPY_STREAM,
    payload: {
      list,
    },
  };
}


export function * sagaCopyStream (fileSystem: FileSystem) {
  yield takeEvery(FS_COPY_STREAM, function * (action: CopyStreamAction) {
    const { list } = action.payload;
    if (list.length !== 1) {
      // TODO error message?
      return;
    }
    const id = list[0];

    const { nodes } = (yield select(getFileSystem)) as FileSystemState;
    const url: string = yield call(() => fileSystem.stream(id, nodes[id].name));

    yield call(() => navigator.clipboard.writeText(url));
  });
}


export function downloadStream (list: string[]): DownloadStreamAction {
  return {
    type: FS_DOWNLOAD_STREAM,
    payload: {
      list,
    },
  };
}


export function * sagaDownloadStream (fileSystem: FileSystem) {
  yield takeEvery(FS_DOWNLOAD_STREAM, function * (action: DownloadStreamAction) {
    const { list } = action.payload;
    if (list.length !== 1) {
      // TODO error message?
      return;
    }
    const id = list[0];

    const url: string = yield call(() => fileSystem.download(id));

    window.open(url, '_blank');
  });
}
