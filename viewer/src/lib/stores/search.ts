import { getContext, setContext } from "svelte";
import { get, writable } from "svelte/store";

import type { SearchResponse } from "$types/api";
import { listNode } from "$tools/api";

const KEY = Symbol();

export function createStore() {
  const searching = writable(false);
  const idList = writable<string[]>([]);
  const resultMap = writable<Record<string, SearchResponse>>({});
  const historyList = writable<string[]>([]);
  const detailList = writable<string[]>([]);

  async function searchText(text: string) {
    searching.set(true);
    try {
      const rawList = await listNode({ name: text, fuzzy: true });
      const list: string[] = [];
      const map: Record<string, SearchResponse> = {};
      for (const row of rawList) {
        list.push(row.id);
        map[row.id] = row;
      }
      resultMap.set(map);
      idList.set(list);
    } finally {
      searching.set(false);
    }
  }

  async function searchName(name: string) {
    historyList.update((self) => {
      return [name, ...self.filter((n) => n !== name)];
    });
    await searchText(name);
  }

  async function searchHistory(index: number) {
    const _historyList = get(historyList);
    const text = _historyList[index];
    historyList.update((self) => {
      return [text, ...self.slice(0, index), ...self.slice(index + 1)];
    });
    await searchText(text);
  }

  return {
    searching,
    idList,
    resultMap,
    historyList,
    detailList,
    searchName,
    searchHistory,
  };
}

export type SearchStore = ReturnType<typeof createStore>;

export function setSearchContext() {
  setContext(KEY, createStore());
}

export function getSearchContext() {
  return getContext<SearchStore>(KEY);
}
