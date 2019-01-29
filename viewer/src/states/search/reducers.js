import {
  SEARCH_NAME_TRY,
  SEARCH_NAME_SUCCEED,
  SEARCH_NAME_FAILED,
  SEARCH_COMPARE_TRY,
  SEARCH_COMPARE_SUCCEED,
  SEARCH_COMPARE_FAILED,
} from './actions';


const initialState = {
  loading: false,
  dict: {},
  list: [],
  history: [],
  diff: null,
};


export default function reduceSearch (state = initialState, { type, payload }) {
  switch (type) {
    case SEARCH_NAME_TRY: {
      if (state.loading) {
        return state;
      }
      const { name } = payload;
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
      const { pathList } = payload;
      const dict = {};
      const list = [];
      for (const entry of pathList) {
        dict[entry.id] = entry;
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
      const { sizeList } = payload;
      return Object.assign({}, state, {
        diff: sizeList,
      });
    }
    default:
      return state;
  }
}
