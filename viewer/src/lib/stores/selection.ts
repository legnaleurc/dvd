import { getContext, setContext } from "svelte";
import { writable } from "svelte/store";

const CONTEXT_KEY = Symbol();

export function createStore() {
  const selectedId = writable<Set<string>>(new Set());

  function toggleId(id: string) {
    selectedId.update((self) => {
      if (self.has(id)) {
        self.delete(id);
      } else {
        self.add(id);
      }
      return self;
    });
  }

  function deselectList(idList: string[]) {
    selectedId.update((self) => {
      for (const id of idList) {
        self.delete(id);
      }
      return self;
    });
  }

  function deselectAll() {
    selectedId.set(new Set());
  }

  return {
    selectedId,
    toggleId,
    deselectAll,
    deselectList,
  };
}

export type SelectionStore = ReturnType<typeof createStore>;

export function setSelectionContext() {
  setContext(CONTEXT_KEY, createStore());
}

export function getSelectionContext() {
  return getContext<SelectionStore>(CONTEXT_KEY);
}
