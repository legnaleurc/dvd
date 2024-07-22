<script lang="ts">
  import { onMount } from "svelte";

  import { beforeNavigate } from "$app/navigation";

  import type { NeverRecord } from "$types/traits";
  import { setSelectionContext } from "$stores/selection";
  import { getFullScreenContext } from "$stores/fullscreen";
  import { setSearchContext } from "$stores/search";
  import { setQueueContext } from "$stores/queue";
  import { setDisabledContext } from "$stores/disabled";
  import BottomBar from "./BottomBar.svelte";
  import TopBar from "./TopBar.svelte";
  import ResultList from "./ResultList.svelte";
  import DetailList from "./DetailList.svelte";

  type $$Slots = {
    default: NeverRecord;
  };

  const { detailList, loadSearchHistory } = setSearchContext();
  const { selectedId, deselectAll } = setSelectionContext();
  const { startQueue, stopQueue } = setQueueContext();
  setDisabledContext();

  const { isFullScreen } = getFullScreenContext();

  let isSelectionEmpty = true;

  beforeNavigate(() => {
    deselectAll();
  });

  onMount(() => {
    startQueue();
    loadSearchHistory();
    return stopQueue;
  });

  $: {
    isSelectionEmpty = $selectedId.size <= 0;
    isFullScreen.set(!isSelectionEmpty);
  }
  $: hasDetails = $detailList.length > 0;
</script>

<div class="w-full h-full flex flex-col">
  <div class="flex-0">
    <TopBar />
  </div>
  <div
    class="flex-1 overflow-y-auto overflow-x-hidden"
    class:hidden={hasDetails}
  >
    <ResultList />
  </div>
  <div
    class="flex-1 overflow-y-auto overflow-x-hidden"
    class:hidden={!hasDetails}
  >
    <DetailList />
  </div>
  {#if !isSelectionEmpty}
    <BottomBar />
  {/if}
  <div class="hidden">
    <slot />
  </div>
</div>
