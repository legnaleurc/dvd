import { getContext, setContext } from "svelte";
import { writable, get } from "svelte/store";

import type { NodeMap, ChildrenMap } from "$types/filesystem";
import { createChangeList, listNodeChildren, readRootNode } from "$tools/api";
import { applyChange, createNode } from "$tools/filesystem";

const CONTEXT_KEY = Symbol();

export function createStore() {
  const isSyncing = writable<boolean>(false);
  const rootId = writable<string>("");
  const nodeMap = writable<NodeMap>({});
  const childrenMap = writable<ChildrenMap>({});

  async function loadRootAndChildren() {
    isSyncing.set(true);
    try {
      const node = await readRootNode();
      const nodeList = await listNodeChildren(node.id);

      const newNodeMap = {
        [node.id]: createNode(node),
      };
      for (const rawNode of nodeList) {
        newNodeMap[rawNode.id] = createNode(rawNode);
      }
      nodeMap.set(newNodeMap);
      childrenMap.set({
        [node.id]: nodeList.map((node) => node.id),
      });
      rootId.set(node.id);
    } catch (e: unknown) {
      console.warn(e);
      nodeMap.set({});
      childrenMap.set({});
      rootId.set("");
    } finally {
      isSyncing.set(false);
    }
  }

  async function loadChildren(id: string) {
    isSyncing.set(true);
    try {
      const nodeList = await listNodeChildren(id);
      nodeMap.update((self) => {
        for (const rawNode of nodeList) {
          const node = createNode(rawNode);
          self[node.id] = node;
        }
        return self;
      });
      childrenMap.update((self) => ({
        ...self,
        [id]: nodeList.map((node) => node.id),
      }));
      return nodeList;
    } finally {
      isSyncing.set(false);
    }
  }

  async function sync() {
    isSyncing.set(true);
    try {
      const changeList = await createChangeList();
      const nodeMap_ = get(nodeMap);
      const childrenMap_ = get(childrenMap);
      changeList.forEach((change) =>
        applyChange(nodeMap_, childrenMap_, change),
      );
      nodeMap.set(nodeMap_);
      childrenMap.set(childrenMap_);
    } finally {
      isSyncing.set(false);
    }
  }

  return {
    isSyncing,
    rootId,
    nodeMap,
    childrenMap,
    loadRootAndChildren,
    loadChildren,
    sync,
  };
}

export type FileSystemStore = ReturnType<typeof createStore>;

export function setFileSystemContext() {
  return setContext(CONTEXT_KEY, createStore());
}

export function getFileSystemContext() {
  return getContext<FileSystemStore>(CONTEXT_KEY);
}
