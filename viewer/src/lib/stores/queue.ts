import { getContext, setContext } from "svelte";
import { writable } from "svelte/store";

import { moveNodeToId, moveNodeToPath, trashNode } from "$tools/api";
import { Queue } from "$tools/queue";

type Task = ((consumerId: number) => Promise<void>) | null;
type ApiTask = (id: string) => Promise<void>;

const MAX_TASK_COUNT = 6;
const KEY = Symbol();

export function createStore() {
  const queue = new Queue<Task>();
  let active = false;
  const pendingList = writable<string[]>([]);
  const pendingCount = writable(0);
  const fullfilledCount = writable(0);
  const rejectedCount = writable(0);

  async function moveNodesToPath(idList: string[], dstPath: string) {
    if (!active) {
      return;
    }
    pendingCount.update((self) => self + idList.length);
    await produceTasks(idList, (id: string) => moveNodeToPath(id, dstPath));
    await queue.join();
  }

  async function moveNodes(idList: string[], dst: string) {
    if (!active) {
      return;
    }
    pendingCount.update((self) => self + idList.length);
    await produceTasks(idList, (id: string) => moveNodeToId(id, dst));
    await queue.join();
  }

  async function trashNodes(idList: string[]) {
    if (!active) {
      return;
    }
    pendingCount.update((self) => self + idList.length);
    await produceTasks(idList, trashNode);
    await queue.join();
  }

  async function produceTasks(idList: string[], api: ApiTask) {
    for (const id of idList) {
      await queue.put(async (consumerId) => {
        pendingList.update((self) => {
          self[consumerId] = id;
          return self;
        });
        try {
          await api(id);
          fullfilledCount.update((self) => self + 1);
        } catch (e: unknown) {
          console.warn(e);
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

  function startQueue() {
    const tmp: string[] = [];
    for (let i = 0; i < MAX_TASK_COUNT; ++i) {
      tmp.push("");
      consume(queue, i);
    }
    pendingList.set(tmp);
    active = true;
  }

  async function stopQueue() {
    for (let i = 0; i < MAX_TASK_COUNT; ++i) {
      queue.put(null);
    }
    await queue.join();
    active = false;
  }

  return {
    pendingList,
    pendingCount,
    fullfilledCount,
    rejectedCount,
    startQueue,
    stopQueue,
    moveNodesToPath,
    moveNodes,
    trashNodes,
  };
}

export type ActionQueueStore = ReturnType<typeof createStore>;

export function setQueueContext() {
  return setContext(KEY, createStore());
}

export function getQueueContext() {
  return getContext<ActionQueueStore>(KEY);
}

async function consume(q: Queue<Task>, id: number) {
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
