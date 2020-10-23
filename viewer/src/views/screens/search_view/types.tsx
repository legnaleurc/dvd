import { SearchResponse } from '@/lib';


export interface Entry {
  id: string;
  name: string;
  hash: string;
  size: number;
  mimeType: string;
  modified: Date;
  path: string;
}


export type EntryDict = {
  [id: string]: Entry;
}


export interface SearchState {
  loading: boolean;
  revision: number;
  dict: EntryDict;
  list: string[];
  history: string[];
  showCompareDialog: boolean;
  compareList: string[];
  identical: boolean;
}


interface Action<T, V> {
  type: T;
  value: V;
}


export type ActionType = (
  | Action<'ERROR', Error>
  | Action<'SEARCH_BEGIN', string>
  | Action<'SEARCH_END', SearchResponse[]>
  | Action<'COMPARE_SHOW', string[]>
  | Action<'COMPARE_HIDE', null>
);
