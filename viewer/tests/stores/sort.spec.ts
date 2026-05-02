import { describe, expect, test } from "vitest";
import { get } from "svelte/store";

import { fileNode } from "$mocks/utils";
import { createStore, getCompareFunction } from "$stores/sort";

describe("sort", () => {
  test("has good initial value", () => {
    const store = createStore();
    expect(get(store.method)).toEqual("BY_DATE_DESC");
  });

  test("descending sort by date", () => {
    const compare = getCompareFunction("BY_DATE_DESC");
    const list = [
      fileNode("a", "", {
        changed: 1,
      }),
      fileNode("b", "", {
        changed: 1,
      }),
      fileNode("c", "", {
        changed: 2,
      }),
    ];
    list.sort(compare);
    expect(list).toEqual([
      fileNode("c", "", {
        changed: 2,
      }),
      fileNode("a", "", {
        changed: 1,
      }),
      fileNode("b", "", {
        changed: 1,
      }),
    ]);
  });

  test("ascending sort by date", () => {
    const compare = getCompareFunction("BY_DATE_ASC");
    const list = [
      fileNode("a", "", {
        changed: 2,
      }),
      fileNode("b", "", {
        changed: 1,
      }),
      fileNode("c", "", {
        changed: 2,
      }),
    ];
    list.sort(compare);
    expect(list).toEqual([
      fileNode("b", "", {
        changed: 1,
      }),
      fileNode("a", "", {
        changed: 2,
      }),
      fileNode("c", "", {
        changed: 2,
      }),
    ]);
  });

  test("ascending sort by name", () => {
    const compare = getCompareFunction("BY_NAME_ASC");
    const list = [
      fileNode("a", "", {
        name: "2",
      }),
      fileNode("b", "", {
        name: "2",
      }),
      fileNode("c", "", {
        name: "1",
      }),
    ];
    list.sort(compare);
    expect(list).toEqual([
      fileNode("c", "", {
        name: "1",
      }),
      fileNode("a", "", {
        name: "2",
      }),
      fileNode("b", "", {
        name: "2",
      }),
    ]);
  });
});
