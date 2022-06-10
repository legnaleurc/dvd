<script lang="ts">
  import type { SvelteCustomEvents } from "$lib/types/traits";
  import { getQueueContext } from "$lib/stores/queue";
  import Modal from "./Modal.svelte";

  type Events = {
    hide: null;
  };
  type $$Events = SvelteCustomEvents<Events>;

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
          <div class="p-3 truncate text-action-disabled">(idle)</div>
        {/if}
      {/each}
    </div>
    <div class="flex mt-3 justify-around">
      <div class="text-danger-500">{$rejectedCount}</div>
      <div class="text-warning-500">{$pendingCount}</div>
      <div class="text-success-500">{$fullfilledCount}</div>
    </div>
  </div>
</Modal>
