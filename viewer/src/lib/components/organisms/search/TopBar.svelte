<script lang="ts">
  import { getSearchContext } from "$lib/stores/search";
  import { getSelectionContext } from "$lib/stores/selection";
  import Icon from "$lib/components/atoms/Icon.svelte";
  import IconButton from "$lib/components/atoms/IconButton.svelte";
  import QueueButton from "$lib/components/molecules/QueueButton.svelte";
  import SearchBox from "./SearchBox.svelte";
  import HistoryButton from "./HistoryButton.svelte";

  const { resultMap, detailList } = getSearchContext();
  const { selectedId, deselectList, deselectAll } = getSelectionContext();

  function getNameById(id: string) {
    return $resultMap[id]?.name ?? "";
  }

  function commitDetails() {
    const idList = Array.from($selectedId);
    detailList.set(idList);
    deselectList(idList);
  }

  function flushDetails() {
    detailList.set([]);
    deselectAll();
  }

  $: hasDetails = $detailList.length > 0;
</script>

<div class="flex flex-col bg-paper-800">
  <div class="flex">
    <SearchBox class="flex-1" disabled={hasDetails} />
    <div class="flex-0 flex">
      {#if !hasDetails}
        <IconButton disabled={$selectedId.size <= 0} on:click={commitDetails}>
          <Icon name="zoom_in" />
        </IconButton>
      {:else}
        <IconButton on:click={flushDetails}>
          <Icon name="zoom_out" />
        </IconButton>
      {/if}
      <QueueButton {getNameById} />
      <HistoryButton disabled={hasDetails} />
    </div>
  </div>
</div>
