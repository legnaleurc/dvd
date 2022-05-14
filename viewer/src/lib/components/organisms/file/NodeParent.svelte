<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$lib/types/traits";
  import { callExternal } from "$lib/tools/external";
  import { getFileSystemContext } from "$lib/stores/filesystem";
  import { getQueueContext } from "$lib/stores/queue";
  import { getSelectionContext } from "$lib/stores/selection";
  import { drag, drop } from "$lib/actions/dragdrop";
  import NodeChildren from "./NodeChildren.svelte";
  import NodeIndicator from "./NodeIndicator.svelte";
  import SortedList from "./SortedList.svelte";

  type Events = {
    begin: string;
    end: string;
  };
  type $$Events = SvelteCustomEvents<Events>;

  const { nodeMap, childrenMap, loadChildren, sync } = getFileSystemContext();
  const { moveNodes } = getQueueContext();
  const { selectedId, toggleId, deselectAll } = getSelectionContext();
  const dispatch = createEventDispatcher<Events>();

  export let id: string;

  let loading = false;
  let expanded = false;

  $: node = $nodeMap[id];
  $: selected = $selectedId.has(id);

  async function handleIndicatorClick() {
    if (!node.isFolder) {
      return;
    }
    if (expanded) {
      expanded = false;
      return;
    }
    if (!$childrenMap[id]) {
      loading = true;
      try {
        await loadChildren(id);
      } finally {
        loading = false;
      }
    }
    expanded = true;
  }

  function handleSingleClick(event: MouseEvent) {
    toggleId(id);
    if (event.shiftKey) {
      dispatch("end", id);
    } else {
      dispatch("begin", id);
    }
  }

  async function handleDoubleClick() {
    await callExternal(id, node.name, node.mimeType);
  }

  function handleDragStart(event: DragEvent) {
    const list = Array.from($selectedId);
    event.dataTransfer.setData("text/plain", JSON.stringify(list));
  }

  function handleDragEnd() {
    deselectAll();
  }

  function handleDrop(event: DragEvent) {
    const raw = event.dataTransfer.getData("text/plain");
    const list: string[] = JSON.parse(raw);
    acceptNodes(list);
  }

  async function acceptNodes(list: string[]) {
    if (node.isFolder) {
      // This node is a folder, accepts action.
      await moveNodes(list, id);
    } else {
      // Send to the parent of this node.
      if (!node.parentId) {
        return;
      }
      await moveNodes(list, node.parentId);
    }
    await sync();
  }
</script>

{#if node}
  <div class="flex flex-col">
    <div
      class="flex"
      use:drop={{
        onDrop: handleDrop,
      }}
      class:bg-action-selected={selected}
    >
      <div class="flex-0">
        <NodeIndicator
          category={node.category}
          isFolder={node.isFolder}
          {loading}
          {expanded}
          on:click={handleIndicatorClick}
        />
      </div>
      <div
        class="flex-1 break-all"
        draggable={selected}
        use:drag={{
          onDragStart: handleDragStart,
          onDragEnd: handleDragEnd,
        }}
        on:click={handleSingleClick}
        on:dblclick={handleDoubleClick}
      >
        {node.name}
      </div>
    </div>
    <SortedList {id} autoLoad={false} let:idList let:loaded>
      {#if loaded}
        <div class="flex" class:hidden={!expanded}>
          <div class="w-6" />
          <NodeChildren {idList} />
        </div>
      {/if}
    </SortedList>
  </div>
{/if}
