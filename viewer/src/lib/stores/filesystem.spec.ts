/// @vitest-environment jsdom

import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  test,
} from "vitest";
import { get } from "svelte/store";
import { setupServer } from "msw/node";

import { handlers } from "$lib/mocks/filesystem";
import { createStore } from "./filesystem";
import { fileNode } from "$lib/mocks/utils";

describe("filesystem", () => {
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

  it("has correct initial values", () => {
    const store = createStore();
    expect(get(store.isSyncing)).toBeFalsy();
    expect(get(store.rootId)).toBeFalsy();
    expect(get(store.nodeMap)).toEqual({});
    expect(get(store.childrenMap)).toEqual({});
  });

  test("load root data", async () => {
    const store = createStore();
    expect(get(store.isSyncing)).toBeFalsy();
    const promise = store.loadRootAndChildren();
    expect(get(store.isSyncing)).toBeTruthy();
    await promise;
    expect(get(store.isSyncing)).toBeFalsy();

    expect(get(store.rootId)).toEqual("__ROOT__");
    const nodeMap = get(store.nodeMap);
    expect(nodeMap).toHaveProperty("__ROOT__");
    expect(nodeMap).toHaveProperty("__ID_1__");
    const childrenMap = get(store.childrenMap);
    expect(childrenMap).toHaveProperty("__ROOT__");
  });

  test("load children", async () => {
    const store = createStore();
    expect(get(store.isSyncing)).toBeFalsy();
    const promise = store.loadChildren("__ROOT__");
    expect(get(store.isSyncing)).toBeTruthy();
    await promise;
    expect(get(store.isSyncing)).toBeFalsy();

    const nodeMap = get(store.nodeMap);
    expect(nodeMap).toHaveProperty("__ID_1__");
    const childrenMap = get(store.childrenMap);
    expect(childrenMap).toHaveProperty("__ROOT__");
  });

  test("sync data", async () => {
    const store = createStore();

    store.nodeMap.update((self) => {
      self["__ID_1__"] = fileNode("__ID_1__", "__ROOT__");
      return self;
    });

    expect(get(store.isSyncing)).toBeFalsy();
    const promise = store.sync();
    expect(get(store.isSyncing)).toBeTruthy();
    await promise;
    expect(get(store.isSyncing)).toBeFalsy();

    const nodeMap = get(store.nodeMap);
    expect(nodeMap["__ID_1__"].name).toEqual("file_1_new");
  });
});
