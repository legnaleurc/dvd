<script lang="ts">
  import type { SvelteCustomEvents } from "$types/traits";
  import { getQueueContext } from "$stores/queue";
  import Modal from "$molecules/Modal.svelte";

  type $$Events = SvelteCustomEvents<{
    hide: null;
  }>;

  export let show: boolean;
  export let getNameById: (id: string) => string;

  const { rejectedCount, pendingCount, fullfilledCount, pendingList } =
    getQueueContext();
</script>

<Modal {show} on:hide>
  <span slot="title">Pending Tasks</span>
  <div slot="body">
    <div>
      {#each $pendingList as id, index (index)}
        {#if id}
          <div class="p-3 truncate">
            {getNameById(id)}
          </div>
        {:else}
          <div class="p-3 truncate opacity-30">(idle)</div>
        {/if}
      {/each}
    </div>
    <div class="flex mt-3 justify-around">
      <div class="text-red-500">{$rejectedCount}</div>
      <div class="text-yellow-500">{$pendingCount}</div>
      <div class="text-green-500">{$fullfilledCount}</div>
    </div>
  </div>
</Modal>
