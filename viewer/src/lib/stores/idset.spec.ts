import { describe, expect, test } from "vitest";
import { get } from "svelte/store";

import { createStore } from "./idset";

describe("idset", () => {
  test("has good initial values", () => {
    const store = createStore();
    expect(get(store.idSet).size).toEqual(0);
  });

  test("toggle id", () => {
    const store = createStore();
    store.idSet.update((self) => {
      self.add("a");
      return self;
    });
    store.toggleId("a");
    store.toggleId("b");
    expect(get(store.idSet)).not.toContain("a");
    expect(get(store.idSet)).toContain("b");
  });

  test("add provided list", () => {
    const store = createStore();
    store.idSet.update((self) => {
      self.add("a");
      self.add("b");
      return self;
    });
    store.addList(["b", "c"]);
    expect(get(store.idSet)).toContain("a");
    expect(get(store.idSet)).toContain("b");
    expect(get(store.idSet)).toContain("c");
  });

  test("delete provided list", () => {
    const store = createStore();
    store.idSet.update((self) => {
      self.add("a");
      self.add("b");
      return self;
    });
    store.deleteList(["b", "c"]);
    expect(get(store.idSet)).toContain("a");
    expect(get(store.idSet)).not.toContain("b");
  });

  test("reset", () => {
    const store = createStore();
    store.idSet.update((self) => {
      self.add("a");
      self.add("b");
      return self;
    });
    store.reset();
    expect(get(store.idSet).size).toEqual(0);
  });
});
