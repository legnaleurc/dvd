<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$lib/types/traits";
  import { getFileSystemContext } from "$lib/stores/filesystem";

  type Events = {
    open: number;
  };
  type $$Events = SvelteCustomEvents<Events>;

  export let stack: string[];

  const { nodeMap } = getFileSystemContext();
  const dispatch = createEventDispatcher<Events>();
</script>

<div class="flex overflow-x-auto">
  {#each stack as id, index (index)}
    <button
      class="mx-1 whitespace-nowrap"
      on:click={() => dispatch("open", index)}
    >
      {#if !$nodeMap[id].name}
        /
      {:else}
        {$nodeMap[id].name}
      {/if}
    </button>
  {/each}
</div>
