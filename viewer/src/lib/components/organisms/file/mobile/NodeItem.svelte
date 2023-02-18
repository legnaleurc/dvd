<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$types/traits";
  import { getFileSystemContext } from "$stores/filesystem";
  import { getSelectionContext } from "$stores/selection";
  import { getDisabledContext } from "$stores/disabled";
  import Icon from "$atoms/Icon.svelte";
  import IconButton from "$atoms/IconButton.svelte";
  import NodeIcon from "$atoms/NodeIcon.svelte";
  import ListItem from "$molecules/ListItem.svelte";

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
  <ListItem {selected} {disabled} on:click={handleSelect}>
    <div slot="title" class="flex gap-3">
      <NodeIcon category={node.category} />
      <div>{node.name}</div>
    </div>
    <svelte:fragment slot="action">
      {#if node.isFolder}
        <IconButton {disabled} on:click={handleOpen}>
          <Icon name="chevron_right" />
        </IconButton>
      {/if}
    </svelte:fragment>
  </ListItem>
{/if}
