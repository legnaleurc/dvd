<script lang="ts">
  import { writable } from "svelte/store";

  import { getSearchContext } from "$lib/stores/search";
  import Icon from "$lib/components/atoms/Icon.svelte";
  import IconButton from "$lib/components/atoms/IconButton.svelte";
  import LabeledSwitch from "$lib/components/atoms/LabeledSwitch.svelte";
  import QueueButton from "$lib/components/molecules/QueueButton.svelte";
  import HistoryModal from "./HistoryModal.svelte";
  import SearchBox from "./SearchBox.svelte";

  const { showDetail, resultMap } = getSearchContext();

  let showMenu = false;
  const showHistory = writable(false);

  function toggleMenu() {
    showMenu = !showMenu;
  }

  function getNameById(id: string) {
    return $resultMap[id]?.name ?? "";
  }
</script>

<div class="flex flex-col bg-paper-800">
  <div class="flex">
    <SearchBox class="flex-1" />
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
      <QueueButton {getNameById} />
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
