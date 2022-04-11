<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$lib/types/traits";
  import EmptyBlock from "$lib/components/atoms/EmptyBlock.svelte";
  import Modal from "$lib/components/molecules/Modal.svelte";

  type Events = {
    hide: null;
    search: number;
  };
  type $$Events = SvelteCustomEvents<Events>;

  export let show: boolean;
  export let historyList: string[];

  const dispatch = createEventDispatcher<Events>();
</script>

<Modal {show} on:hide>
  <span slot="title">Search History</span>
  <div slot="body" class="flex flex-col">
    {#each historyList as history, index (index)}
      <div
        class="p-3 cursor-pointer"
        on:click={() => {
          dispatch("search", index);
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
