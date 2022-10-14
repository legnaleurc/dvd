import { getContext, setContext } from "svelte";
import { writable } from "svelte/store";

import type { Node_ } from "$types/filesystem";

const KEY = Symbol();

export type SortMethod = "BY_DATE_DESC" | "BY_DATE_ASC" | "BY_NAME_ASC";

export const METHOD_LIST: readonly SortMethod[] = [
  "BY_DATE_DESC",
  "BY_DATE_ASC",
  "BY_NAME_ASC",
] as const;

type CompareFunction = (a: Node_, b: Node_) => number;

const SORT_MAP: Record<SortMethod, CompareFunction> = {
  BY_DATE_DESC: sortByDateDesc,
  BY_DATE_ASC: sortByDateAsc,
  BY_NAME_ASC: sortByNameAsc,
};

const LABEL_MAP: Record<SortMethod, string> = {
  BY_DATE_DESC: "Sort by date desc",
  BY_DATE_ASC: "Sort by date asc",
  BY_NAME_ASC: "Sort by name asc",
};

export function getCompareFunction(method: SortMethod) {
  return SORT_MAP[method];
}

export function getLabel(method: SortMethod) {
  return LABEL_MAP[method];
}

export function createStore() {
  const method = writable<SortMethod>("BY_DATE_DESC");
  return {
    method,
  };
}

export type SortStore = ReturnType<typeof createStore>;

export function setSortContext() {
  setContext(KEY, createStore());
}

export function getSortContext() {
  return getContext<SortStore>(KEY);
}

function sortByDateAsc(a: Node_, b: Node_) {
  if (a.modified !== b.modified) {
    return a.modified - b.modified;
  }
  return a.id < b.id ? -1 : 1;
}

function sortByDateDesc(a: Node_, b: Node_) {
  if (a.modified !== b.modified) {
    return b.modified - a.modified;
  }
  return a.id < b.id ? -1 : 1;
}

function sortByNameAsc(a: Node_, b: Node_) {
  if (a.name !== b.name) {
    return a.name < b.name ? -1 : 1;
  }
  return a.id < b.id ? -1 : 1;
}
