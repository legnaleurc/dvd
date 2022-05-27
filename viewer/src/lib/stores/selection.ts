import { getContext, setContext } from "svelte";

import { createStore } from "./idset";

const KEY = Symbol();

export function setSelectionContext() {
  const store = createStore();
  return setContext(KEY, {
    selectedId: store.idSet,
    toggleId: store.toggleId,
    deselectAll: store.reset,
    deselectList: store.deleteList,
  });
}

export type SelectionStore = ReturnType<typeof setSelectionContext>;

export function getSelectionContext() {
  return getContext<SelectionStore>(KEY);
}
