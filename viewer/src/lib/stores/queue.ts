import { getContext, onMount, setContext } from "svelte";
import { writable } from "svelte/store";

import { moveNodeToId, moveNodeToPath, trashNode } from "$tools/api";
import { Queue } from "$tools/queue";

type Task = ((consumerId: number) => Promise<void>) | null;
type ApiTask = (id: string) => Promise<void>;

const MAX_TASK_COUNT = 6;
const KEY = Symbol();

export function createStore() {
  const queue = new Queue<Task>();
  const pendingList = writable<string[]>([]);
  const pendingCount = writable(0);
  const fullfilledCount = writable(0);
  const rejectedCount = writable(0);

  async function moveNodesToPath(idList: string[], dstPath: string) {
    pendingCount.update((self) => self + idList.length);
    await produceTasks(idList, (id: string) => moveNodeToPath(id, dstPath));
    await queue.join();
  }

  async function moveNodes(idList: string[], dst: string) {
    pendingCount.update((self) => self + idList.length);
    await produceTasks(idList, (id: string) => moveNodeToId(id, dst));
    await queue.join();
  }

  async function trashNodes(idList: string[]) {
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
    fullfilledCount,
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
