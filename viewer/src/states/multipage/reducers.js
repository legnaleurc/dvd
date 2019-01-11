import {
  MPV_LOAD_TRY,
  MPV_LOAD_SUCCEED,
  MPV_LOAD_FAILED,
} from './actions';


const initialState = {
  unpacking: false,
  imageList: [],
};


export default function reduceMultiPage (state = initialState, { type, payload }) {
  switch (type) {
    case MPV_LOAD_TRY: {
      return Object.assign({}, state, {
        unpacking: true,
        imageList: [],
      });
    }
    case MPV_LOAD_SUCCEED: {
      return Object.assign({}, state, {
        unpacking: false,
        imageList: payload.imageList,
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
