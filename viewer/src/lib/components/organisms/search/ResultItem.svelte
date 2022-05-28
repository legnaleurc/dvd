<script lang="ts">
  import { getDisabledContext } from "$lib/stores/disabled";
  import { getSelectionContext } from "$lib/stores/selection";
  import { getSearchContext } from "$lib/stores/search";

  export let id: string;

  const { disabledId } = getDisabledContext();
  const { resultMap, showDetail } = getSearchContext();
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

<div
  class="p-3"
  class:bg-action-selected={selected}
  class:text-action-disabled={disabled}
  on:click={handleClick}
>
  <div>{result.name}</div>
  <div class="text-symbol-hint">{result.path}</div>
  {#if $showDetail}
    <div class="text-symbol-hint">{result.modified}</div>
    <div class="text-symbol-hint">{result.hash}</div>
    <div class="text-symbol-hint">{result.size}</div>
  {/if}
</div>
