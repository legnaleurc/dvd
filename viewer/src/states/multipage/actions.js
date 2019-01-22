import { call, put, takeEvery } from 'redux-saga/effects';


export const MPV_LOAD_TRY = 'MPV_LOAD_TRY';
export const MPV_LOAD_SUCCEED = 'MPV_LOAD_SUCCEED';
export const MPV_LOAD_FAILED = 'MPV_LOAD_FAILED';


export function loadMultiPageViewer (list, done) {
  return {
    type: MPV_LOAD_TRY,
    payload: {
      list,
      done,
    },
  };
}


function loadMultiPageViewerSucceed (imageList) {
  return {
    type: MPV_LOAD_SUCCEED,
    payload: {
      imageList,
    },
  };
}


function loadMultiPageViewerFailed (message) {
  return {
    type: MPV_LOAD_FAILED,
    payload: {
      message,
    },
  };
}


export function * sagaLoadMultiPageViewer (fileSystem) {
  yield takeEvery(MPV_LOAD_TRY, function * ({ payload }) {
    try {
      let srcList = payload.list;
      if (srcList.length !== 1) {
        yield put(loadMultiPageViewerFailed('SELECTED_MULTIPLE_OR_NONE'));
        return;
      }
      const id = srcList[0];
      srcList = yield call(() => fileSystem.imageList(id));
      srcList = srcList.map((data, index) => {
        data.url = fileSystem.image(id, index);
        return data;
      });
      yield put(loadMultiPageViewerSucceed(srcList));

      const done = payload.done;
      if (done) {
        yield call(done);
      }
    } catch (e) {
      yield put(loadMultiPageViewerFailed(e.message));
    }
  });
}
