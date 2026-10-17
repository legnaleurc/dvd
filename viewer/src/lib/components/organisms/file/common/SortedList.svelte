<script lang="ts" context="module">
  import type { Node_ } from "#types/filesystem.js";
  import {
    getCompareFunction,
    getSortContext,
    type SortMethod,
  } from "#stores/sort.js";

  function getSortedIdList(
    map: Record<string, Node_>,
    list: string[],
    m: SortMethod,
  ): string[] {
    const nodeList = list.map((id) => map[id]);
    nodeList.sort(getCompareFunction(m));
    return nodeList.map((node) => node.id);
  }
</script>

<script lang="ts">
  import { onMount } from "svelte";

  import { getFileSystemContext } from "#stores/filesystem.js";

  type $$Slots = {
    default: {
      loaded: boolean;
      idList: string[];
    };
  };

  const { nodeMap, childrenMap, loadChildren } = getFileSystemContext();
  const { method } = getSortContext();

  export let id: string;
  export let autoLoad: boolean;

  $: loaded = $childrenMap[id] !== undefined;
  $: idList = getSortedIdList($nodeMap, $childrenMap[id] ?? [], $method);

  onMount(async () => {
    if (!loaded && autoLoad) {
      await loadChildren(id);
    }
  });
</script>

<slot {loaded} {idList} />
