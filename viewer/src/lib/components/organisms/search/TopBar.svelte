<script lang="ts">
  import { writable } from "svelte/store";

  import { getSearchContext } from "$lib/stores/search";
  import Icon from "$lib/components/atoms/Icon.svelte";
  import IconButton from "$lib/components/atoms/IconButton.svelte";
  import QueueButton from "$lib/components/molecules/QueueButton.svelte";
  import HistoryModal from "./HistoryModal.svelte";
  import SearchBox from "./SearchBox.svelte";

  const { resultMap } = getSearchContext();

  const showHistory = writable(false);

  function getNameById(id: string) {
    return $resultMap[id]?.name ?? "";
  }
</script>

<div class="flex flex-col bg-paper-800">
  <div class="flex">
    <SearchBox class="flex-1" />
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
