import React from 'react';

import { Selection, ActionType } from './types';


interface IState {
  dict: Selection;
  count: number;
  last: string | null;
}
function reduce (state: IState, action: ActionType) {
  switch (action.type) {
    case 'TOGGLE':
      if (state.dict[action.value]) {
        delete state.dict[action.value];
        return {
          ...state,
          dict: {
            ...state.dict,
          },
          count: state.count - 1,
          last: null,
        };
      } else {
        return {
          ...state,
          dict: {
            ...state.dict,
            [action.value]: true,
          },
          count: state.count + 1,
          last: action.value,
        };
      }
    case 'SELECT_FROM_LAST': {
      const { dict, last } = state;
      if (!last) {
        return state;
      }

      let list = action.value.sourceList;
      const id = action.value.id;
      if (!list) {
        return state;
      }
      let toIndex = list.indexOf(id);
      if (toIndex < 0) {
        return state;
      }
      let fromIndex = list.indexOf(last);
      if (fromIndex < 0) {
        return state;
      }
      if (toIndex < fromIndex) {
        [fromIndex, toIndex] = [toIndex, fromIndex];
      }

      let count = state.count;
      list = list.slice(fromIndex, toIndex + 1);
      for (const id of list) {
        if (!dict[id]) {
          ++count;
        }
        dict[id] = true;
      }

      return {
        ...state,
        dict: { ...dict },
        count,
        last: id,
      };
    }
    case 'CLEAR':
      return {
        ...state,
        dict: {},
        count: 0,
        last: null,
      };
    default:
      return state;
  }
}


export function useReducer () {
  return React.useReducer(reduce, {
    dict: {},
    count: 0,
    last: null,
  });
}
