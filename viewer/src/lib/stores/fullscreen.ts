import { getContext, setContext } from "svelte";
import { writable } from "svelte/store";

const KEY = Symbol();

export function createStore() {
  const isFullScreen = writable(false);

  function toggleFullScreen() {
    isFullScreen.update((self) => !self);
  }

  return {
    isFullScreen,
    toggleFullScreen,
  };
}

export type FullScreenStore = ReturnType<typeof createStore>;

export function setFullScreenContext() {
  setContext(KEY, createStore());
}

export function getFullScreenContext() {
  return getContext<FullScreenStore>(KEY);
}
