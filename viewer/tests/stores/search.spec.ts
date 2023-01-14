/// @vitest-environment jsdom

import { describe, beforeAll, afterAll, afterEach, expect, test } from "vitest";
import { get } from "svelte/store";
import { setupServer } from "msw/node";

import { handlers } from "$mocks/search";
import { createStore } from "$stores/search";

describe("search", () => {
  const server = setupServer(...handlers);
  beforeAll(() => {
    server.listen();
  });
  afterAll(() => {
    server.close();
  });
  afterEach(() => {
    localStorage.clear();
    server.resetHandlers();
  });

  test("has good initial value", () => {
    const store = createStore();
    expect(get(store.searching)).toBeFalsy();
    expect(get(store.idList)).toHaveLength(0);
    expect(get(store.resultMap)).toEqual({});
    expect(get(store.historyList)).toHaveLength(0);
  });

  test("search name", async () => {
    const store = createStore();

    const promise = store.searchName("name");
    expect(get(store.searching)).toBeTruthy();

    await promise;
    expect(get(store.historyList)).toHaveLength(1);
    expect(get(store.searching)).toBeFalsy();
  });

  test("search history", async () => {
    const store = createStore();
    store.historyList.set(["b", "a"]);

    const promise = store.searchHistory(1);
    expect(get(store.searching)).toBeTruthy();

    await promise;
    expect(get(store.historyList)).toEqual(["a", "b"]);
    expect(get(store.searching)).toBeFalsy();
  });

  test("no duplicate history", async () => {
    const store = createStore();

    await store.searchName("name");
    await store.searchName("test");
    expect(get(store.historyList)).toEqual(["test", "name"]);
    await store.searchName("name");
    expect(get(store.historyList)).toEqual(["name", "test"]);
  });
});
