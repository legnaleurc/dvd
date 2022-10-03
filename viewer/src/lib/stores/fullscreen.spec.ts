import { describe, expect, it, test } from "vitest";
import { get } from "svelte/store";

import { createStore } from "./fullscreen";

describe("fullscreen", () => {
  it("is not fullscreen by default", () => {
    const store = createStore();
    const _isFullscreen = get(store.isFullScreen);
    expect(_isFullscreen).toBeFalsy();
  });

  test("toggle works", () => {
    const store = createStore();
    store.toggleFullScreen();
    expect(get(store.isFullScreen)).toBeTruthy();
    store.toggleFullScreen();
    expect(get(store.isFullScreen)).toBeFalsy();
  });
});
