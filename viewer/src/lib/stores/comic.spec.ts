import { get } from "svelte/store";
import { setupServer } from "msw/node";

import { handlers } from "$lib/mocks/comic";
import { createStore } from "./comic";

describe("comic", () => {
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
    expect(get(store.idList)).toEqual([]);
    expect(get(store.comicMap)).toEqual({});
  });

  test("open comic with known name", async () => {
    const store = createStore();

    const promise = store.openComic("__NORMAL__", "name");
    expect(get(store.idList)).toContain("__NORMAL__");
    expect(get(store.comicMap)).toHaveProperty("__NORMAL__");
    expect(get(store.comicMap)["__NORMAL__"].unpacking).toBeTruthy();
    expect(get(store.comicMap)["__NORMAL__"].name).toEqual("name");

    await promise;
    expect(get(store.comicMap)["__NORMAL__"].unpacking).toBeFalsy();
    expect(get(store.comicMap)["__NORMAL__"].imageList).toHaveLength(1);
  });

  test("open invalid comic with known name", async () => {
    const store = createStore();

    const promise = store.openComic("__INVALID__", "name");
    expect(get(store.idList)).toContain("__INVALID__");
    expect(get(store.comicMap)).toHaveProperty("__INVALID__");
    expect(get(store.comicMap)["__INVALID__"].unpacking).toBeTruthy();
    expect(get(store.comicMap)["__INVALID__"].name).toEqual("name");

    await promise;
    expect(get(store.comicMap)["__INVALID__"].unpacking).toBeFalsy();
    expect(get(store.comicMap)["__INVALID__"].imageList).toHaveLength(0);
  });

  test("open comic without name", async () => {
    const store = createStore();

    const promise = store.openComic("__NORMAL__", "");
    expect(get(store.idList)).toContain("__NORMAL__");
    expect(get(store.comicMap)).toHaveProperty("__NORMAL__");
    expect(get(store.comicMap)["__NORMAL__"].unpacking).toBeTruthy();
    expect(get(store.comicMap)["__NORMAL__"].name).toEqual("");

    await promise;
    expect(get(store.comicMap)["__NORMAL__"].unpacking).toBeFalsy();
    expect(get(store.comicMap)["__NORMAL__"].name).toEqual("__NORMAL__");
    expect(get(store.comicMap)["__NORMAL__"].imageList).toHaveLength(1);
  });

  test("open invalid comic without name", async () => {
    const store = createStore();

    const promise = store.openComic("__INVALID__", "");
    expect(get(store.idList)).toContain("__INVALID__");
    expect(get(store.comicMap)).toHaveProperty("__INVALID__");
    expect(get(store.comicMap)["__INVALID__"].unpacking).toBeTruthy();
    expect(get(store.comicMap)["__INVALID__"].name).toEqual("");

    await promise;
    expect(get(store.comicMap)["__INVALID__"].unpacking).toBeFalsy();
    expect(get(store.comicMap)["__INVALID__"].name).toEqual("__INVALID__");
    expect(get(store.comicMap)["__INVALID__"].imageList).toHaveLength(0);
  });

  test("open cached", async () => {
    const store = createStore();
    await store.openCachedComic();
    expect(get(store.idList)).toContain("__NORMAL__");
    expect(get(store.comicMap)).toHaveProperty("__NORMAL__");
    expect(get(store.comicMap)["__NORMAL__"].unpacking).toBeFalsy();
    expect(get(store.comicMap)["__NORMAL__"].name).toEqual("__NORMAL__");
    expect(get(store.comicMap)["__NORMAL__"].imageList).toHaveLength(1);
  });

  test("clear cache", async () => {
    const store = createStore();
    store.idList.set(["__NORMAL__"]);
    store.comicMap.set({
      __NORMAL__: {
        unpacking: false,
        name: "",
        imageList: [],
      },
    });
    await store.clearComic();
    expect(get(store.idList)).toEqual([]);
    expect(get(store.comicMap)).toEqual({});
  });
});
