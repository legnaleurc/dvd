<script lang="ts">
  import { writable } from "svelte/store";

  import { getQueueContext } from "$lib/stores/queue";
  import { getSelectionContext } from "$lib/stores/selection";
  import { getSearchContext } from "$lib/stores/search";
  import Icon from "$lib/components/atoms/Icon.svelte";
  import IconButton from "$lib/components/atoms/IconButton.svelte";
  import SearchInput from "$lib/components/atoms/SearchInput.svelte";
  import LabeledSwitch from "$lib/components/atoms/LabeledSwitch.svelte";
  import QueueButton from "$lib/components/molecules/QueueButton.svelte";
  import HistoryModal from "./HistoryModal.svelte";

  const { pendingList, pendingCount, resolvedCount, rejectedCount } =
    getQueueContext();
  const { deselectAll } = getSelectionContext();
  const { searchName, showDetail, resultMap } = getSearchContext();

  let text = "";
  let showMenu = false;
  const showHistory = writable(false);

  function toggleMenu() {
    showMenu = !showMenu;
  }

  function handleSearch() {
    if (!text) {
      return;
    }
    deselectAll();
    searchName(text);
  }

  function getNameById(id: string) {
    return $resultMap[id]?.name ?? "";
  }
</script>

<div class="flex flex-col bg-paper-800">
  <div class="flex">
    <SearchInput
      class="flex-1"
      placeholder="Search"
      bind:value={text}
      on:enterpressed={handleSearch}
    />
    <div class="flex-0">
      <IconButton on:click={toggleMenu}>
        <Icon name={showMenu ? "expand_less" : "expand_more"} />
      </IconButton>
    </div>
  </div>
  <div class:flex={showMenu} class:hidden={!showMenu}>
    <div class="flex-0">
      <LabeledSwitch
        id="search-item-mode"
        label="View Detail"
        bind:checked={$showDetail}
      />
    </div>
    <div class="flex-1" />
    <div class="flex-0">
      <QueueButton
        {getNameById}
        pendingList={$pendingList}
        pendingCount={$pendingCount}
        rejectedCount={$rejectedCount}
        resolvedCount={$resolvedCount}
      />
      <IconButton on:click={() => showHistory.set(true)}>
        <Icon name="history" />
      </IconButton>
      <HistoryModal
        show={$showHistory}
        on:hide={() => showHistory.set(false)}
      />
    </div>
  </div>
</div>
