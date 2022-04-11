import { getContext, onMount, setContext } from "svelte";
import { writable } from "svelte/store";

import { loadShortcutList, saveShortcutList } from "$lib/tools/storage";

const KEY = Symbol();

export function createStore() {
  const shortcutList = writable<string[]>([]);

  function addShortcut(shortcut: string) {
    shortcutList.update((self) => {
      if (self.includes(shortcut)) {
        return self;
      }
      self.push(shortcut);
      saveShortcutList(self);
      return self;
    });
  }

  function updateShortcut(index: number, shortcut: string) {
    shortcutList.update((self) => {
      self[index] = shortcut;
      saveShortcutList(self);
      return self;
    });
  }

  function removeShortcut(index: number) {
    shortcutList.update((self) => {
      const tmp = [...self.slice(0, index), ...self.slice(index + 1)];
      saveShortcutList(tmp);
      return tmp;
    });
  }

  return {
    shortcutList,
    addShortcut,
    updateShortcut,
    removeShortcut,
  };
}

export type ShortcutStore = ReturnType<typeof createStore>;

export function setShortcutContext() {
  const store = createStore();
  onMount(() => {
    store.shortcutList.set(loadShortcutList());
  });
  setContext(KEY, store);
}

export function getShortcutContext() {
  return getContext<ShortcutStore>(KEY);
}
