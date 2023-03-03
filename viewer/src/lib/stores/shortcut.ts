import { getContext, setContext } from "svelte";
import { writable } from "svelte/store";

import { loadShortcutList, saveShortcutList } from "$tools/storage";

const KEY = Symbol();

export function createStore() {
  const shortcutList = writable<string[]>([]);

  function loadShortcut() {
    shortcutList.set(loadShortcutList());
  }

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
    loadShortcut,
    addShortcut,
    updateShortcut,
    removeShortcut,
  };
}

export type ShortcutStore = ReturnType<typeof createStore>;

export function setShortcutContext() {
  return setContext(KEY, createStore());
}

export function getShortcutContext() {
  return getContext<ShortcutStore>(KEY);
}
