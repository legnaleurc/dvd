<script lang="ts">
  import { getDisabledContext } from "$stores/disabled";
  import { getSelectionContext } from "$stores/selection";
  import { getSearchContext } from "$stores/search";
  import ListItem from "$molecules/ListItem.svelte";

  export let id: string;
  export let detailed: boolean;

  const { disabledId } = getDisabledContext();
  const { resultMap } = getSearchContext();
  const { selectedId, toggleId } = getSelectionContext();

  $: result = $resultMap[id];
  $: selected = $selectedId.has(id);
  $: disabled = $disabledId.has(id);

  function handleClick() {
    if (disabled) {
      return;
    }
    toggleId(id);
  }
</script>

<ListItem {disabled} {selected} on:click={handleClick}>
  <span slot="title" class="break-all">{result.name}</span>
  <div slot="caption" class="flex flex-col">
    <div class="break-all">{result.parent_path}</div>
    {#if detailed}
      <div class="font-mono">{result.id}</div>
      <div class="font-mono">{result.hash}</div>
      <div class="font-mono">{result.size}</div>
      <div class="font-mono">{result.mtime}</div>
    {/if}
  </div>
</ListItem>
