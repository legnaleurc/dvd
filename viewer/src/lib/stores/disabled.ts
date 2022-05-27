import { getContext, setContext } from "svelte";

import { createStore } from "./idset";

const KEY = Symbol();

export function setDisabledContext() {
  const store = createStore();
  return setContext(KEY, {
    disabledId: store.idSet,
    toggleId: store.toggleId,
    enableAll: store.reset,
    enableList: store.deleteList,
    disableList: store.addList,
  });
}

export type DisabledStore = ReturnType<typeof setDisabledContext>;

export function getDisabledContext() {
  return getContext<DisabledStore>(KEY);
}
