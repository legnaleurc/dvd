<script lang="ts">
  import { beforeNavigate } from "$app/navigation";

  import type { SearchResponse } from "$lib/types/api";
  import { listNodeByName } from "$lib/tools/api";
  import {
    getSelectionContext,
    setSelectionContext,
  } from "$lib/stores/selection";
  import { getFullScreenContext } from "$lib/stores/fullscreen";
  import { setQueueContext } from "$lib/stores/queue";
  import SearchToolBar from "./SearchToolBar.svelte";
  import SearchBar from "./SearchBar.svelte";
  import ResultList from "./ResultList.svelte";

  setSelectionContext();
  setQueueContext();

  const { isFullScreen } = getFullScreenContext();
  const { selectedId, deselectAll } = getSelectionContext();

  let idList: string[] = [];
  let resultMap: Record<string, SearchResponse> = {};
  let historyList: string[] = [];
  let searching = false;
  let isSelectionEmpty = true;

  async function searchText(text: string) {
    deselectAll();
    searching = true;
    try {
      const rawList = await listNodeByName(text);
      const list: string[] = [];
      const map: Record<string, SearchResponse> = {};
      for (const row of rawList) {
        list.push(row.id);
        map[row.id] = row;
      }
      resultMap = map;
      idList = list;
    } finally {
      searching = false;
    }
  }

  async function handleSearch(event: CustomEvent<string>) {
    const text = event.detail;
    historyList = [text, ...historyList];
    await searchText(text);
  }

  async function handleHistory(event: CustomEvent<number>) {
    const index = event.detail;
    const text = historyList[index];
    historyList = [
      text,
      ...historyList.slice(0, index),
      ...historyList.slice(index + 1),
    ];
    await searchText(text);
  }

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
    <SearchBar
      {historyList}
      on:search={handleSearch}
      on:history={handleHistory}
    />
  </div>
  <div class="flex-1 overflow-y-auto overflow-x-hidden">
    <ResultList {idList} {resultMap} {searching} />
  </div>
  {#if !isSelectionEmpty}
    <SearchToolBar {resultMap} />
  {/if}
  <div class="hidden">
    <slot />
  </div>
</div>
