import React from 'react';

import { ActionType, MAX_TASK_COUNT } from './types';


interface IState {
  nameList: string[];
  pendingCount: number;
  resolvedCount: number;
  rejectedCount: number;
}
function reduce (state: IState, action: ActionType) {
  switch (action.type) {
    case 'ADD_PENDING':
      return {
        ...state,
        pendingCount: state.pendingCount + action.value,
      };
    case 'SET_PROGRESS': {
      const { consumerId, name } = action.value;
      const { nameList } = state;
      nameList[consumerId] = name;
      return {
        ...state,
        nameList: [...nameList],
      };
    }
    case 'RESOLVE': {
      const consumerId = action.value;
      const { nameList, pendingCount, resolvedCount } = state;
      nameList[consumerId] = '';
      return {
        ...state,
        nameList: [...nameList],
        pendingCount: pendingCount - 1,
        resolvedCount: resolvedCount + 1,
      };
    }
    case 'REJECT': {
      const consumerId = action.value;
      const { nameList, pendingCount, rejectedCount } = state;
      nameList[consumerId] = '';
      return {
        ...state,
        nameList: [...nameList],
        pendingCount: pendingCount - 1,
        rejectedCount: rejectedCount + 1,
      };
    }
    default:
      return state;
  }
}


export function useReducer () {
  const nameList = [];
  for (let i = 0; i < MAX_TASK_COUNT; ++i) {
    nameList.push('');
  }
  return React.useReducer(reduce, {
    nameList,
    pendingCount: 0,
    resolvedCount: 0,
    rejectedCount: 0,
  });
}
