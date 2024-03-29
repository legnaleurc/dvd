/// @vitest-environment jsdom

import { describe, expect, beforeAll, afterAll, afterEach, test } from "vitest";
import { get } from "svelte/store";
import { setupServer } from "msw/node";

import { handlers } from "$mocks/video";
import { createStore } from "$stores/video";

describe("video", () => {
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
    expect(get(store.videoMap)).toEqual({});
    expect(get(store.errorList)).toEqual([]);
  });

  test("open video", async () => {
    const store = createStore();
    await store.openVideo("__NORMAL__");
    expect(get(store.idList)).toEqual(["__NORMAL__"]);
    expect(get(store.videoMap)).toHaveProperty("__NORMAL__");
    expect(get(store.errorList)).toEqual([]);
  });

  test("open invalid video", async () => {
    const store = createStore();
    await store.openVideo("__INVALID__");
    expect(get(store.idList)).toEqual([]);
    expect(get(store.videoMap)).not.toHaveProperty("__INVALID__");
    expect(get(store.errorList)).toEqual(["Not Found"]);
  });

  test("clear video", () => {
    const store = createStore();
    store.idList.set(["test"]);
    store.videoMap.set({
      __NORMAL__: {
        id: "__NORMAL__",
        name: "NORMAL",
        mimeType: "video/mp4",
        width: 800,
        height: 600,
        path: "__NORMAL__",
      },
    });
    store.errorList.set(["Not Found"]);
    store.clearAllVideo();
    expect(get(store.idList)).toEqual([]);
    expect(get(store.videoMap)).toEqual({});
    expect(get(store.errorList)).toEqual(["Not Found"]);
  });

  test("clear error", () => {
    const store = createStore();
    store.idList.set(["test"]);
    store.videoMap.set({
      __NORMAL__: {
        id: "__NORMAL__",
        name: "NORMAL",
        mimeType: "video/mp4",
        width: 800,
        height: 600,
        path: "__NORMAL__",
      },
    });
    store.errorList.set(["Not Found"]);
    store.clearError();
    expect(get(store.idList)).toEqual(["test"]);
    expect(get(store.videoMap)).toEqual({
      __NORMAL__: {
        id: "__NORMAL__",
        name: "NORMAL",
        mimeType: "video/mp4",
        width: 800,
        height: 600,
        path: "__NORMAL__",
      },
    });
    expect(get(store.errorList)).toEqual([]);
  });
});
