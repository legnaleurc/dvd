import React from 'react';

import { INodeLike } from '@/lib';


export type GetNode = (id: string) => INodeLike;

interface IProgressData {
  consumerId: number;
  name: string;
}

interface IAction<T, V> {
  type: T;
  value: V;
}
export type ActionType = (
  | IAction<'ADD_PENDING', number>
  | IAction<'SET_PROGRESS', IProgressData>
  | IAction<'RESOLVE', number>
  | IAction<'REJECT', number>
);

export type Dispatch = React.Dispatch<ActionType>;

export const MAX_TASK_COUNT = 6;
