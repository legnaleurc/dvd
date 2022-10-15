<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$types/traits";
  import { callExternal } from "$tools/external";
  import { getDisabledContext } from "$stores/disabled";
  import { getDragDropContext } from "$stores/dragdrop";
  import { getFileSystemContext } from "$stores/filesystem";
  import { getQueueContext } from "$stores/queue";
  import { getSelectionContext } from "$stores/selection";
  import { drag, drop } from "$actions/dragdrop";
  import SortedList from "$organisms/file/common/SortedList.svelte";
  import NodeChildren from "./NodeChildren.svelte";
  import NodeIndicator from "./NodeIndicator.svelte";

  type $$Events = SvelteCustomEvents<{
    begin: string;
    end: string;
  }>;

  const { disabledId, disableList, enableList } = getDisabledContext();
  const { acceptedId } = getDragDropContext();
  const { nodeMap, childrenMap, loadChildren, sync } = getFileSystemContext();
  const { moveNodes } = getQueueContext();
  const { selectedId, toggleId, deselectList } = getSelectionContext();
  const dispatch = createEventDispatcher();

  export let id: string;

  let loading = false;
  let expanded = false;

  $: node = $nodeMap[id];
  $: selected = $selectedId.has(id);
  $: disabled = $disabledId.has(id);

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
    if (disabled) {
      return;
    }
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
    disableList(list);
    deselectList(list);
    await acceptNodes(list, dst);
    enableList(list);
  }

  function handleDragEnter(event: DragEvent) {
    if (disabled) {
      event.dataTransfer.dropEffect = "none";
    }
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
      class:bg-action-selected={selected}
      class:drop-enabled={!disabled}
      use:drop={{
        onDragEnter: handleDragEnter,
        onDrop: handleDrop,
      }}
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
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div
        class="flex-1 break-all"
        class:text-action-disabled={disabled}
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
