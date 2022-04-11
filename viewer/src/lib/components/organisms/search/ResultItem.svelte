<script lang="ts">
  import type { SearchResponse } from "$lib/types/api";
  import { getSelectionContext } from "$lib/stores/selection";

  export let id: string;
  export let resultMap: Record<string, SearchResponse>;

  const { selectedId, toggleId } = getSelectionContext();

  function handleClick() {
    toggleId(id);
  }

  $: result = resultMap[id];
  $: selected = $selectedId.has(id);
</script>

<div class="p-3" class:bg-action-selected={selected} on:click={handleClick}>
  <div>{result.name}</div>
  <div class="text-symbol-hint">{result.path}</div>
</div>
