<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$types/traits";
  import { getFileSystemContext } from "$stores/filesystem";
  import { getSelectionContext } from "$stores/selection";
  import { getDisabledContext } from "$stores/disabled";
  import { onButtonClick } from "$actions/event";
  import Icon from "$atoms/Icon.svelte";
  import IconButton from "$atoms/IconButton.svelte";
  import NodeIcon from "$atoms/NodeIcon.svelte";

  export let id: string;

  type $$Events = SvelteCustomEvents<{
    open: string;
  }>;

  const { nodeMap } = getFileSystemContext();
  const { selectedId, toggleId } = getSelectionContext();
  const { disabledId } = getDisabledContext();
  const dispatch = createEventDispatcher();

  $: selected = $selectedId.has(id);
  $: disabled = $disabledId.has(id);
  $: node = $nodeMap[id];

  function handleOpen() {
    dispatch("open", id);
  }

  function handleSelect() {
    if (disabled) {
      return;
    }
    toggleId(id);
  }
</script>

{#if node}
  <div
    class="flex"
    class:bg-action-selected={selected}
    class:text-action-disabled={disabled}
  >
    <div
      role="button"
      tabindex="0"
      class="flex-1 flex"
      use:onButtonClick={handleSelect}
    >
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
