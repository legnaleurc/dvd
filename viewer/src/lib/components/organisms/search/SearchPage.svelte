<script lang="ts">
  import { onMount } from "svelte";

  import { beforeNavigate, goto } from "$app/navigation";
  import { page } from "$app/state";

  import type { NeverRecord } from "$types/traits";
  import { setSelectionContext } from "$stores/selection";
  import { getFullScreenContext } from "$stores/fullscreen";
  import { setSearchContext } from "$stores/search";
  import { setQueueContext } from "$stores/queue";
  import { setDisabledContext } from "$stores/disabled";
  import { useVisibilityChange } from "$atoms/LifeCycle.svelte";
  import BottomBar from "./BottomBar.svelte";
  import TopBar from "./TopBar.svelte";
  import ResultList from "./ResultList.svelte";
  import DetailList from "./DetailList.svelte";

  type $$Slots = {
    default: NeverRecord;
  };

  const { detailList, nameInput, loadSearchHistory, searchName } =
    setSearchContext();
  const { selectedId, deselectAll } = setSelectionContext();
  const { startQueue, stopQueue } = setQueueContext();
  const { isFullScreen } = getFullScreenContext();
  setDisabledContext();
  const { onVisible } = useVisibilityChange();

  function popQueryName(): string {
    const routeId = page.route.id;
    if (routeId !== "/search") {
      return "";
    }

    const url = new URL(page.url.href);
    const queryName = url.searchParams.get("name");
    url.searchParams.delete("name");
    goto(url, { shallow: true, replace: true, state: page.state });
    if (!queryName) {
      return "";
    }

    return queryName;
  }

  let isSelectionEmpty = true;

  beforeNavigate(({ shallow, type }) => {
    if (shallow && type === "goto") return;

    deselectAll();
  });

  onMount(() => {
    startQueue();
    return stopQueue;
  });

  onMount(() => {
    loadSearchHistory().then(() => {
      const queryName = popQueryName();
      if (!queryName) {
        return;
      }
      $nameInput = queryName;
      return searchName(queryName);
    });
  });

  onVisible(() => {
    loadSearchHistory();
  });

  $: {
    isSelectionEmpty = $selectedId.size <= 0;
    isFullScreen.set(!isSelectionEmpty);
  }
  $: hasDetails = $detailList.length > 0;
</script>

<div class="w-full h-full flex flex-col">
  <div>
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

  <div class="hidden"><slot></slot></div>
</div>
