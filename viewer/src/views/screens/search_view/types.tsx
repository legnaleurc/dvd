import { SearchResponse } from '@/lib';


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
  revision: number;
  dict: EntryDict;
  list: string[];
  history: string[];
  showCompareDialog: boolean;
  diff: CompareResult[] | null;
}


interface Action<T, V> {
  type: T;
  value: V;
}


export type ActionType = (
  | Action<'ERROR', Error>
  | Action<'SEARCH_BEGIN', string>
  | Action<'SEARCH_END', SearchResponse[]>
  | Action<'COMPARE', string[]>
  | Action<'COMPARE_SHOW', string[]>
  | Action<'COMPARE_HIDE', null>
);
