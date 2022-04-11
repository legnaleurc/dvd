<script lang="ts">
  import type { SearchResponse } from "$lib/types/api";
  import LoadingBlock from "$lib/components/atoms/LoadingBlock.svelte";
  import EmptyBlock from "$lib/components/atoms/EmptyBlock.svelte";
  import ResultItem from "./ResultItem.svelte";

  export let idList: string[];
  export let resultMap: Record<string, SearchResponse>;
  export let searching: boolean;
</script>

<div class="flex flex-col">
  {#if searching}
    <LoadingBlock />
  {:else}
    {#each idList as id (id)}
      <ResultItem {id} {resultMap} />
    {:else}
      <EmptyBlock />
    {/each}
  {/if}
</div>
