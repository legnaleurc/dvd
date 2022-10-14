import { describe, expect, test } from "vitest";
import { get } from "svelte/store";

import { createStore } from "$stores/dragdrop";

describe("dragdrop", () => {
  test("has good initial value", () => {
    const store = createStore();
    expect(get(store.acceptedId)).toEqual("");
  });
});
