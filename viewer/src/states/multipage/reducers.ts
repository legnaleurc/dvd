import {
  MPV_LOAD_TRY,
  MPV_LOAD_SUCCEED,
  MPV_LOAD_FAILED,
  ActionTypes,
  SucceedLoadAction,
  MpvState,
} from './types';


const initialState: MpvState = {
  unpacking: false,
  imageList: [],
};


export default function reduceMultiPage (state: MpvState = initialState, action: ActionTypes) {
  switch (action.type) {
    case MPV_LOAD_TRY: {
      return Object.assign({}, state, {
        unpacking: true,
        imageList: [],
      });
    }
    case MPV_LOAD_SUCCEED: {
      return Object.assign({}, state, {
        unpacking: false,
        imageList: (action as SucceedLoadAction).payload.imageList,
      });
    }
    case MPV_LOAD_FAILED: {
      return Object.assign({}, state, {
        unpacking: false,
        imageList: [],
      });
    }
    default:
      return state;
  }
}
