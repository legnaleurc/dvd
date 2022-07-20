<script lang="ts">
  import { getSearchContext } from "$lib/stores/search";
  import Icon from "$lib/components/atoms/Icon.svelte";
  import IconButton from "$lib/components/atoms/IconButton.svelte";
  import QueueButton from "$lib/components/molecules/QueueButton.svelte";
  import HistoryModal from "./HistoryModal.svelte";
  import SearchBox from "./SearchBox.svelte";

  const { resultMap } = getSearchContext();

  let showHistory = false;

  function getNameById(id: string) {
    return $resultMap[id]?.name ?? "";
  }
</script>

<div class="flex flex-col bg-paper-800">
  <div class="flex">
    <SearchBox class="flex-1" />
    <div class="flex-0">
      <QueueButton {getNameById} />
      <IconButton on:click={() => (showHistory = true)}>
        <Icon name="history" />
      </IconButton>
      <HistoryModal show={showHistory} on:hide={() => (showHistory = false)} />
    </div>
  </div>
</div>
