import { ChangeResponse, NodeResponse } from "@/lib";


export interface IFileNode {
  id: string;
  name: string;
  mimeType: string;
}


export interface Node {
  id: string;
  name: string;
  parentId: string | null;
  modified: number;
  mimeType: string;
  children: string[] | null;
  fetched: boolean;
}


export type NodeDict = { [id: string]: Node };


export const SORT_BY_NAME_ASC = 'SORT_BY_NAME_ASC';
export const SORT_BY_MTIME_ASC = 'SORT_BY_MTIME_ASC';
export const SORT_BY_MTIME_DES = 'SORT_BY_MTIME_DES';
export type SortKey = (
  | typeof SORT_BY_NAME_ASC
  | typeof SORT_BY_MTIME_ASC
  | typeof SORT_BY_MTIME_DES
);


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
  | IAction<'SYNC_BEGIN', null>
  | IAction<'SYNC_END', ChangeResponse[]>
  | IAction<'LOAD_ROOT_BEGIN', null>
  | IAction<'LOAD_ROOT_END', ILoadRoot>
  | IAction<'LOAD_LIST_BEGIN', null>
  | IAction<'LOAD_LIST_END', ILoadList>
  | IAction<'RENAME_BEGIN', null>
  | IAction<'RENAME_END', null>
  | IAction<'SORT', SortKey>
);
