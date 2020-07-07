import { SearchResponse } from '../../lib';


export interface Entry {
  id: string;
  name: string;
  hash: string;
  size: number;
  mimeType: string;
  path: string;
}


export type EntryDict = {
  [id: string]: Entry;
}


export interface CompareResult {
  size: number;
  path: string;
}


export interface SearchState {
  loading: boolean;
  dict: EntryDict;
  list: string[];
  history: string[];
  diff: CompareResult[] | null;
}


interface Action<T> {
  type: string;
  payload: T;
}


export const SEARCH_NAME_PRE = 'SEARCH_NAME_PRE';
export type PreSearchNameAction = Action<{
  name: string;
}>;
export const SEARCH_NAME_TRY = 'SEARCH_NAME_TRY';
export type TrySearchNameAction = Action<{
  name: string;
}>;
export const SEARCH_NAME_SUCCEED = 'SEARCH_NAME_SUCCEED';
export type SucceedSearchNameAction = Action<{
  pathList: SearchResponse[];
}>;
export const SEARCH_NAME_FAILED = 'SEARCH_NAME_FAILED';
export type FailedSearchNameAction = Action<{
  message: string;
}>;


export const SEARCH_COMPARE_TRY = 'SEARCH_COMPARE_TRY';
export type TrySearchCompareAction = Action<{
  idList: string[];
}>;
export const SEARCH_COMPARE_SUCCEED = 'SEARCH_COMPARE_SUCCEED';
export type SucceedSearchCompareAction = Action<null>;
export const SEARCH_COMPARE_FAILED = 'SEARCH_COMPARE_FAILED';
export type FailedSearchCompareAction = Action<{
  sizeList: CompareResult[];
}>;


export const SEARCH_OPEN_STREAM = 'SEARCH_OPEN_STREAM';
export type OpenStreamAction = Action<{
  id: string;
}>;


export type ActionTypes = (
  PreSearchNameAction |
  TrySearchNameAction |
  SucceedSearchNameAction |
  FailedSearchNameAction |
  TrySearchCompareAction |
  SucceedSearchCompareAction |
  FailedSearchCompareAction |
  OpenStreamAction
);
