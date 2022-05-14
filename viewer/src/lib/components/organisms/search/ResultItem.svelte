<script lang="ts">
  import { getSelectionContext } from "$lib/stores/selection";
  import { getSearchContext } from "$lib/stores/search";

  export let id: string;

  const { resultMap, showDetail } = getSearchContext();
  const { selectedId, toggleId } = getSelectionContext();

  function handleClick() {
    toggleId(id);
  }

  $: result = $resultMap[id];
  $: selected = $selectedId.has(id);
</script>

<div class="p-3" class:bg-action-selected={selected} on:click={handleClick}>
  <div>{result.name}</div>
  <div class="text-symbol-hint">{result.path}</div>
  {#if $showDetail}
    <div class="text-symbol-hint">{result.modified}</div>
    <div class="text-symbol-hint">{result.hash}</div>
    <div class="text-symbol-hint">{result.size}</div>
  {/if}
</div>
