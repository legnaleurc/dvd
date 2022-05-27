<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$lib/types/traits";
  import { callExternal } from "$lib/tools/external";
  import { getDragDropContext } from "$lib/stores/dragdrop";
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
  const { selectedId, toggleId, deselectList } = getSelectionContext();
  const { acceptedId } = getDragDropContext();
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

  async function handleDragEnd() {
    const dst = $acceptedId;
    $acceptedId = "";
    if (!dst) {
      return;
    }
    const list = Array.from($selectedId);
    await acceptNodes(list, dst);
    deselectList(list);
  }

  // NOTE
  // Will always fires before dragend by spec.
  function handleDrop() {
    $acceptedId = id;
  }

  async function acceptNodes(list: string[], dst: string) {
    const dstNode = $nodeMap[dst];
    if (dstNode.isFolder) {
      // This node is a folder, accepts action.
      await moveNodes(list, dst);
    } else {
      // Send to the parent of this node.
      if (!dstNode.parentId) {
        return;
      }
      await moveNodes(list, dstNode.parentId);
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
