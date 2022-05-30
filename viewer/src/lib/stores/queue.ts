import { getContext, onMount, setContext } from "svelte";
import { writable } from "svelte/store";

import { moveNode, listNodeByPath, trashNode } from "$lib/tools/api";
import { Queue } from "$lib/tools/queue";

type Task = ((consumerId: number) => Promise<void>) | null;

const MAX_TASK_COUNT = 6;
const KEY = Symbol();

export function createStore() {
  const queue = new Queue<Task>();
  const pendingList = writable<string[]>([]);
  const pendingCount = writable(0);
  const resolvedCount = writable(0);
  const rejectedCount = writable(0);

  async function moveNodesToPath(idList: string[], dstPath: string) {
    pendingCount.update((self) => self + idList.length);

    const dst = await fetchIdFromPath(dstPath);
    if (!dst) {
      rejectedCount.update((self) => self + idList.length);
      pendingCount.update((self) => self - idList.length);
      return;
    }

    await innerMoveNodes(idList, dst);
    await queue.join();
  }

  async function moveNodes(idList: string[], dst: string) {
    pendingCount.update((self) => self + idList.length);
    await innerMoveNodes(idList, dst);
    await queue.join();
  }

  async function innerMoveNodes(idList: string[], dst: string) {
    for (const id of idList) {
      await queue.put(async (consumerId) => {
        pendingList.update((self) => {
          self[consumerId] = id;
          return self;
        });
        try {
          await moveNode(id, dst);
          resolvedCount.update((self) => self + 1);
        } catch (e: unknown) {
          rejectedCount.update((self) => self + 1);
        } finally {
          pendingCount.update((self) => self - 1);
          pendingList.update((self) => {
            self[consumerId] = "";
            return self;
          });
        }
      });
    }
  }

  async function trashNodes(idList: string[]) {
    pendingCount.update((self) => self + idList.length);

    for (const id of idList) {
      await queue.put(async (consumerId) => {
        pendingList.update((self) => {
          self[consumerId] = id;
          return self;
        });
        try {
          await trashNode(id);
          resolvedCount.update((self) => self + 1);
        } catch (e: unknown) {
          rejectedCount.update((self) => self + 1);
        } finally {
          pendingCount.update((self) => self - 1);
          pendingList.update((self) => {
            self[consumerId] = "";
            return self;
          });
        }
      });
    }

    await queue.join();
  }

  function setup() {
    const tmp: string[] = [];
    for (let i = 0; i < MAX_TASK_COUNT; ++i) {
      tmp.push("");
      consume(queue, i);
    }
    pendingList.set(tmp);
    return async () => {
      for (let i = 0; i < MAX_TASK_COUNT; ++i) {
        queue.put(null);
      }
      await queue.join();
    };
  }

  return {
    pendingList,
    pendingCount,
    resolvedCount,
    rejectedCount,
    setup,
    moveNodesToPath,
    moveNodes,
    trashNodes,
  };
}

export type ActionQueueStore = ReturnType<typeof createStore>;

export function setQueueContext() {
  const store = createStore();
  onMount(store.setup);
  setContext(KEY, store);
}

export function getQueueContext() {
  return getContext<ActionQueueStore>(KEY);
}

async function consume(q: Queue<Task>, id: number) {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const task = await q.get();
    try {
      if (!task) {
        return;
      }
      await task(id);
    } catch (e) {
      console.warn(e);
    } finally {
      q.taskDone();
    }
  }
}

async function fetchIdFromPath(path: string) {
  const rawNodeList = await listNodeByPath(path);
  if (rawNodeList.length <= 0) {
    return "";
  }
  const rawNode = rawNodeList[0];
  return rawNode.id;
}
