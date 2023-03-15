<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$types/traits";
  import { getSearchContext } from "$stores/search";
  import { getSelectionContext } from "$stores/selection";
  import EmptyBlock from "$atoms/EmptyBlock.svelte";
  import Modal from "$molecules/Modal.svelte";

  type $$Events = SvelteCustomEvents<{
    hide: null;
  }>;

  export let show: boolean;

  const { historyList, searchHistory } = getSearchContext();
  const { deselectAll } = getSelectionContext();
  const dispatch = createEventDispatcher();

  function handleSearchHistory(index: number) {
    deselectAll();
    searchHistory(index);
    dispatch("hide");
  }
</script>

<Modal {show} on:hide>
  <span slot="title">Search History</span>
  <div slot="body" class="flex flex-col">
    {#each $historyList as history, index (index)}
      <button class="p-3" on:click={() => handleSearchHistory(index)}>
        {history}
      </button>
    {:else}
      <EmptyBlock />
    {/each}
  </div>
</Modal>
