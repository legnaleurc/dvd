import { getContext, setContext } from "svelte";
import { writable } from "svelte/store";

const KEY = Symbol();

export function createStore() {
  const acceptedId = writable("");
  return {
    acceptedId,
  };
}

export type DragDropStore = ReturnType<typeof createStore>;

export function setDragDropContext() {
  return setContext(KEY, createStore());
}

export function getDragDropContext() {
  return getContext<DragDropStore>(KEY);
}
