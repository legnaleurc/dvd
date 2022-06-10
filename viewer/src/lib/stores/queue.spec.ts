import { get } from "svelte/store";
import { setupServer } from "msw/node";

import { handlers } from "$lib/mocks/queue";
import { createStore, type ActionQueueStore } from "./queue";

describe("queue", () => {
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
  let store: ActionQueueStore;
  let tearDown: () => Promise<void>;
  beforeEach(() => {
    store = createStore();
    tearDown = store.setup();
  });
  afterEach(async () => {
    await tearDown();
  });

  test("has good initial values", () => {
    expect(get(store.pendingCount)).toEqual(0);
    expect(get(store.fullfilledCount)).toEqual(0);
    expect(get(store.rejectedCount)).toEqual(0);
    expect(get(store.pendingList)).toEqual(["", "", "", "", "", ""]);
  });

  test("move nodes", async () => {
    const promise = store.moveNodes(["a", "b", "c", "d", "e", "f", "g"], "0");
    expect(get(store.pendingCount)).toEqual(7);
    expect(get(store.fullfilledCount)).toEqual(0);
    expect(get(store.rejectedCount)).toEqual(0);
    await promise;
    expect(get(store.pendingCount)).toEqual(0);
    expect(get(store.fullfilledCount)).toEqual(3);
    expect(get(store.rejectedCount)).toEqual(4);
  });

  test("move nodes", async () => {
    const promise = store.moveNodesToPath(
      ["a", "b", "c", "d", "e", "f", "g"],
      "/",
    );
    expect(get(store.pendingCount)).toEqual(7);
    expect(get(store.fullfilledCount)).toEqual(0);
    expect(get(store.rejectedCount)).toEqual(0);
    await promise;
    expect(get(store.pendingCount)).toEqual(0);
    expect(get(store.fullfilledCount)).toEqual(3);
    expect(get(store.rejectedCount)).toEqual(4);
  });

  test("trash nodes", async () => {
    const promise = store.trashNodes(["a", "b", "c", "d", "e", "f", "g"]);
    expect(get(store.pendingCount)).toEqual(7);
    expect(get(store.fullfilledCount)).toEqual(0);
    expect(get(store.rejectedCount)).toEqual(0);
    await promise;
    expect(get(store.pendingCount)).toEqual(0);
    expect(get(store.fullfilledCount)).toEqual(3);
    expect(get(store.rejectedCount)).toEqual(4);
  });
});
