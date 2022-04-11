import { get } from "svelte/store";

import { createStore } from "./selection";

describe("selection", () => {
  test("has good initial values", () => {
    const store = createStore();
    expect(get(store.selectedId).size).toEqual(0);
  });

  test("toggle id", () => {
    const store = createStore();
    store.selectedId.update((self) => {
      self.add("a");
      return self;
    });
    store.toggleId("a");
    store.toggleId("b");
    expect(get(store.selectedId)).not.toContain("a");
    expect(get(store.selectedId)).toContain("b");
  });

  test("deselect provided list", () => {
    const store = createStore();
    store.selectedId.update((self) => {
      self.add("a");
      self.add("b");
      return self;
    });
    store.deselectList(["b", "c"]);
    expect(get(store.selectedId)).toContain("a");
    expect(get(store.selectedId)).not.toContain("b");
  });

  test("deselect all", () => {
    const store = createStore();
    store.selectedId.update((self) => {
      self.add("a");
      self.add("b");
      return self;
    });
    store.deselectAll();
    expect(get(store.selectedId).size).toEqual(0);
  });
});
