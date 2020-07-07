import { call, put, takeEvery } from 'redux-saga/effects';

import { FileSystem, ImageResponse } from '../../lib';
import {
  MPV_LOAD_TRY,
  TryLoadAction,
  MPV_LOAD_SUCCEED,
  SucceedLoadAction,
  MPV_LOAD_FAILED,
  FailedLoadAction,
  ImageData,
} from './types';


export function loadMultiPageViewer (list: string[], done: () => void): TryLoadAction {
  return {
    type: MPV_LOAD_TRY,
    payload: {
      list,
      done,
    },
  };
}


function loadMultiPageViewerSucceed (imageList: ImageData[]): SucceedLoadAction {
  return {
    type: MPV_LOAD_SUCCEED,
    payload: {
      imageList,
    },
  };
}


function loadMultiPageViewerFailed (message: string): FailedLoadAction {
  return {
    type: MPV_LOAD_FAILED,
    payload: {
      message,
    },
  };
}


export function * sagaLoadMultiPageViewer (fileSystem: FileSystem) {
  yield takeEvery(MPV_LOAD_TRY, function * (action: TryLoadAction) {
    try {
      const srcList = action.payload.list;
      if (srcList.length !== 1) {
        yield put(loadMultiPageViewerFailed('SELECTED_MULTIPLE_OR_NONE'));
        return;
      }
      const id = srcList[0];
      const imageList: ImageResponse[] = yield call(() => fileSystem.imageList(id));
      const imageDataList = imageList.map((data, index) => {
        const url = fileSystem.image(id, index);
        return {
          ...data,
          url,
        };
      });
      yield put(loadMultiPageViewerSucceed(imageDataList));

      const done = action.payload.done;
      if (done) {
        yield call(done);
      }
    } catch (e) {
      yield put(loadMultiPageViewerFailed(e.message));
    }
  });
}
