<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import VirtualScroll from "svelte-virtual-scroll-list";

  import type { SvelteCustomEvents } from "$types/traits";
  import LoadingBlock from "$atoms/LoadingBlock.svelte";
  import NodeItem from "./NodeItem.svelte";

  type $$Events = SvelteCustomEvents<{
    open: string;
  }>;

  export let loaded: boolean;
  export let idList: string[];

  const dispatch = createEventDispatcher();

  function handleOpen(event: CustomEvent<string>) {
    dispatch("open", event.detail);
  }
</script>

<div class="w-full h-full">
  {#if !loaded}
    <LoadingBlock />
  {:else}
    <VirtualScroll
      data={idList.map((id) => ({ id }))}
      estimateSize={48}
      let:data
    >
      <NodeItem id={data.id} on:open={handleOpen} />
    </VirtualScroll>
  {/if}
</div>
