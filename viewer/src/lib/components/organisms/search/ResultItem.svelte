<script lang="ts">
  import { getDisabledContext } from "$lib/stores/disabled";
  import { getSelectionContext } from "$lib/stores/selection";
  import { getSearchContext } from "$lib/stores/search";

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

<div
  class="p-3"
  class:bg-action-selected={selected}
  class:text-action-disabled={disabled}
  on:click={handleClick}
>
  <div>{result.name}</div>
  <div class="text-symbol-hint">{result.path}</div>
  {#if detailed}
    <div class="text-symbol-hint font-mono">{result.id}</div>
    <div class="text-symbol-hint font-mono">{result.hash}</div>
    <div class="text-symbol-hint font-mono">{result.size}</div>
    <div class="text-symbol-hint font-mono">{result.modified}</div>
  {/if}
</div>
