/// @vitest-environment jsdom

import { afterEach, describe, expect, test } from "vitest";
import { get } from "svelte/store";

import { createStore } from "$stores/shortcut";
import { expectNotNull } from "$tests/lib";

describe("shortcut", () => {
  afterEach(() => {
    localStorage.clear();
  });

  test("has good initial value", () => {
    const store = createStore();
    expect(get(store.shortcutList)).toHaveLength(0);
  });

  test("add shortcut", () => {
    const store = createStore();
    store.addShortcut("a");
    expect(get(store.shortcutList)).toContain("a");
    const rv = localStorage.getItem("shortcutList");
    expectNotNull(rv);
    expect(JSON.parse(rv)).toEqual(["a"]);
  });

  test("update shortcut", () => {
    const store = createStore();
    store.shortcutList.set(["a"]);
    store.updateShortcut(0, "b");
    expect(get(store.shortcutList)).toContain("b");
    const rv = localStorage.getItem("shortcutList");
    expectNotNull(rv);
    expect(JSON.parse(rv)).toEqual(["b"]);
  });

  test("update shortcut", () => {
    const store = createStore();
    store.shortcutList.set(["a"]);
    store.removeShortcut(0);
    expect(get(store.shortcutList)).not.toContain("a");
    const rv = localStorage.getItem("shortcutList");
    expectNotNull(rv);
    expect(JSON.parse(rv)).toEqual([]);
  });
});
