<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$lib/types/traits";
  import { getFileSystemContext } from "$lib/stores/filesystem";
  import { getSelectionContext } from "$lib/stores/selection";
  import Icon from "$lib/components/atoms/Icon.svelte";
  import IconButton from "$lib/components/atoms/IconButton.svelte";
  import NodeIcon from "$lib/components/atoms/NodeIcon.svelte";

  export let id: string;

  type Events = {
    open: string;
  };
  type $$Events = SvelteCustomEvents<Events>;

  const { nodeMap } = getFileSystemContext();
  const { selectedId, toggleId } = getSelectionContext();
  const dispatch = createEventDispatcher<Events>();

  function handleOpen() {
    dispatch("open", id);
  }

  function handleSelect() {
    toggleId(id);
  }

  $: selected = $selectedId.has(id);
  $: node = $nodeMap[id];
</script>

{#if node}
  <div class="flex" class:bg-action-selected={selected}>
    <div class="flex-1 flex" on:click={handleSelect}>
      <div class="w-12 h-12 p-3">
        <NodeIcon category={node.category} />
      </div>
      <div class="p-3 break-all">{node.name}</div>
    </div>
    <div class="flex-0">
      {#if node.isFolder}
        <IconButton on:click={handleOpen}>
          <Icon name="chevron_right" />
        </IconButton>
      {/if}
    </div>
  </div>
{/if}
