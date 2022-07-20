<script lang="ts">
  import { getSearchContext } from "$lib/stores/search";
  import LoadingBlock from "$lib/components/atoms/LoadingBlock.svelte";
  import EmptyBlock from "$lib/components/atoms/EmptyBlock.svelte";
  import ResultItem from "./ResultItem.svelte";

  const { searching, idList } = getSearchContext();
</script>

<div class="flex flex-col">
  {#if $searching}
    <LoadingBlock />
  {:else}
    {#each $idList as id (id)}
      <ResultItem {id} detailed={false} />
    {:else}
      <EmptyBlock />
    {/each}
  {/if}
</div>
