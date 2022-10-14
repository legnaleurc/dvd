<script lang="ts">
  import { getSearchContext } from "$stores/search";
  import ResultItem from "./ResultItem.svelte";

  const { detailList } = getSearchContext();
</script>

<div class="flex flex-col">
  {#each $detailList as id (id)}
    <ResultItem {id} detailed={true} />
  {/each}
</div>
