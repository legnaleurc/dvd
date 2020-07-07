import { NodeResponse, ChangeResponse } from '../../lib';


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


export interface FileSystemState {
  updating: boolean;
  nodes: NodeDict;
  rootId: string | null;
  sortKey: string;
  // denotes the changes from the database point of view
  revision: number;
}


interface Action<T> {
  type: string;
  payload: T;
}


export const FS_LIST_GET_TRY = 'FS_LIST_GET_TRY';
export type TryGetListAction = Action<{
  id: string;
}>;
export const FS_LIST_GET_SUCCEED = 'FS_LIST_GET_SUCCEED';
export type SucceedGetListAction = Action<{
  id: string;
  children: NodeResponse[];
}>;
export const FS_LIST_GET_FAILED = 'FS_LIST_GET_FAILED';
export type FailedGetListAction = Action<{
  message: string;
}>;


export const FS_ROOT_GET_TRY = 'FS_ROOT_GET_TRY';
export type TryGetRootAction = Action<null>;
export const FS_ROOT_GET_SUCCEED = 'FS_ROOT_GET_SUCCEED';
export type SucceedGetRootAction = Action<{
  node: NodeResponse;
  children: NodeResponse[];
}>;
export const FS_ROOT_GET_FAILED = 'FS_ROOT_GET_FAILED';
export type FailedGetRootAction = Action<{
  message: string;
}>;


export const FS_SYNC_TRY = 'FS_SYNC_TRY';
export type TrySyncAction = Action<null>;
export const FS_SYNC_SUCCEED = 'FS_SYNC_SUCCEED';
export type SucceedSyncAction = Action<{
  changeList: ChangeResponse[];
}>;
export const FS_SYNC_FAILED = 'FS_SYNC_FAILED';
export type FailedSyncAction = Action<{
  message: string;
}>;


export const FS_MOVE_TRY = 'FS_MOVE_TRY';
export type TryMoveAction = Action<{
  srcList: string[];
  dst: string;
}>;
export const FS_MOVE_SUCCEED = 'FS_MOVE_SUCCEED';
export type SucceedMoveAction = Action<null>;
export const FS_MOVE_FAILED = 'FS_MOVE_FAILED';
export type FailedMoveAction = Action<{
  message: string;
}>;


export const FS_TRASH_TRY = 'FS_TRASH_TRY';
export type TryTrashAction = Action<{
  list: string[];
}>;
export const FS_TRASH_SUCCEED = 'FS_TRASH_SUCCEED';
export type SucceedTrashAction = Action<null>;
export const FS_TRASH_FAILED = 'FS_TRASH_FAILED';
export type FailedTrashAction = Action<{
  message: string;
}>;


export const FS_SET_SORT = 'FS_SET_SORT';
export type SetSortAction = Action<{
  key: string;
}>;


export const FS_OPEN_STREAM = 'FS_OPEN_STREAM';
export type OpenStreamAction = Action<{
  id: string;
}>;
export const FS_COPY_STREAM = 'FS_COPY_STREAM';
export type CopyStreamAction = Action<{
  list: string[];
}>;
export const FS_DOWNLOAD_STREAM = 'FS_DOWNLOAD_STREAM';
export type DownloadStreamAction = Action<{
  list: string[];
}>;


export type ActionTypes = (
  TryGetListAction |
  SucceedGetListAction |
  FailedGetListAction |
  TryGetRootAction |
  SucceedGetRootAction |
  FailedGetRootAction |
  TrySyncAction |
  SucceedSyncAction |
  FailedSyncAction |
  TryMoveAction |
  SucceedMoveAction |
  FailedMoveAction |
  TryTrashAction |
  SucceedTrashAction |
  FailedTrashAction |
  SetSortAction |
  OpenStreamAction |
  CopyStreamAction |
  DownloadStreamAction
);
