<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$types/traits";
  import { getSearchContext } from "$stores/search";
  import { getSelectionContext } from "$stores/selection";
  import EmptyBlock from "$atoms/EmptyBlock.svelte";
  import Modal from "$molecules/Modal.svelte";

  type Events = {
    hide: null;
  };
  type $$Events = SvelteCustomEvents<Events>;

  export let show: boolean;

  const { historyList, searchHistory } = getSearchContext();
  const { deselectAll } = getSelectionContext();
  const dispatch = createEventDispatcher<Events>();
</script>

<Modal {show} on:hide>
  <span slot="title">Search History</span>
  <div slot="body" class="flex flex-col">
    {#each $historyList as history, index (index)}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div
        class="p-3 cursor-pointer"
        on:click={() => {
          deselectAll();
          searchHistory(index);
          dispatch("hide");
        }}
      >
        {history}
      </div>
    {:else}
      <EmptyBlock />
    {/each}
  </div>
</Modal>
