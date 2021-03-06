import { ChangeResponse, NodeResponse, INodeLike } from "@/lib";


export interface Node_ extends INodeLike {
  modified: number;
  fetched: boolean;
}


export type NodeDict = { [id: string]: Node_ };


export const SORT_BY_NAME_ASC = 'SORT_BY_NAME_ASC';
export const SORT_BY_MTIME_ASC = 'SORT_BY_MTIME_ASC';
export const SORT_BY_MTIME_DES = 'SORT_BY_MTIME_DES';
export type SortKey = (
  | typeof SORT_BY_NAME_ASC
  | typeof SORT_BY_MTIME_ASC
  | typeof SORT_BY_MTIME_DES
);


export type SortFunction = (l: Node_, r: Node_) => number;


interface IAction<T, V> {
  type: T;
  value: V;
}


interface ILoadRoot {
  rawNode: NodeResponse;
  children: NodeResponse[];
}


interface ILoadList {
  id: string;
  children: NodeResponse[];
}


export type ActionType = (
  | IAction<'ERROR', Error>
  | IAction<'REQUEST_BEGIN', null>
  | IAction<'SYNC_END', ChangeResponse[]>
  | IAction<'LOAD_ROOT_END', ILoadRoot>
  | IAction<'LOAD_LIST_END', ILoadList>
  | IAction<'SORT', SortKey>
);
