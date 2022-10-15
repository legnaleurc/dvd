<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$types/traits";
  import { getFileSystemContext } from "$stores/filesystem";

  type $$Events = SvelteCustomEvents<{
    open: number;
  }>;

  export let stack: string[];

  const { nodeMap } = getFileSystemContext();
  const dispatch = createEventDispatcher();
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
