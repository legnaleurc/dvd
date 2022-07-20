<script lang="ts">
  import { beforeNavigate } from "$app/navigation";

  import {
    getSelectionContext,
    setSelectionContext,
  } from "$lib/stores/selection";
  import { getFullScreenContext } from "$lib/stores/fullscreen";
  import { setSearchContext } from "$lib/stores/search";
  import { setQueueContext } from "$lib/stores/queue";
  import { setDisabledContext } from "$lib/stores/disabled";
  import BottomBar from "./BottomBar.svelte";
  import TopBar from "./TopBar.svelte";
  import ResultList from "./ResultList.svelte";

  setSearchContext();
  setSelectionContext();
  setQueueContext();
  setDisabledContext();

  const { isFullScreen } = getFullScreenContext();
  const { selectedId, deselectAll } = getSelectionContext();

  let isSelectionEmpty = true;

  beforeNavigate(() => {
    deselectAll();
  });

  $: {
    isSelectionEmpty = $selectedId.size <= 0;
    isFullScreen.set(!isSelectionEmpty);
  }
</script>

<div class="w-full h-full flex flex-col">
  <div class="flex-0">
    <TopBar />
  </div>
  <div class="flex-1 overflow-y-auto overflow-x-hidden">
    <ResultList />
  </div>
  {#if !isSelectionEmpty}
    <BottomBar />
  {/if}
  <div class="hidden">
    <slot />
  </div>
</div>
