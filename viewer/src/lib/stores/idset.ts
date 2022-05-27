import { writable } from "svelte/store";

export function createStore() {
  const idSet = writable<Set<string>>(new Set());

  function toggleId(id: string) {
    idSet.update((self) => {
      if (self.has(id)) {
        self.delete(id);
      } else {
        self.add(id);
      }
      return self;
    });
  }

  function addList(idList: string[]) {
    idSet.update((self) => {
      for (const id of idList) {
        self.add(id);
      }
      return self;
    });
  }

  function deleteList(idList: string[]) {
    idSet.update((self) => {
      for (const id of idList) {
        self.delete(id);
      }
      return self;
    });
  }

  function reset() {
    idSet.set(new Set());
  }

  return {
    idSet,
    toggleId,
    reset,
    deleteList,
    addList,
  };
}

export type IdSetStore = ReturnType<typeof createStore>;
