<script lang="ts">
  import { writable } from "svelte/store";

  import { getSearchContext } from "$lib/stores/search";
  import Icon from "$lib/components/atoms/Icon.svelte";
  import IconButton from "$lib/components/atoms/IconButton.svelte";
  import SearchInput from "$lib/components/atoms/SearchInput.svelte";
  import HistoryModal from "./HistoryModal.svelte";

  const { searchName } = getSearchContext();

  let text: string = "";
  const showHistory = writable(false);

  function handleSearch() {
    if (!text) {
      return;
    }
    searchName(text);
  }
</script>

<div class="flex bg-paper-800">
  <SearchInput
    class="flex-1"
    placeholder="Search"
    bind:value={text}
    on:enterpressed={handleSearch}
  />
  <div class="flex-0">
    <IconButton on:click={() => showHistory.set(true)}>
      <Icon name="history" />
    </IconButton>
    <HistoryModal show={$showHistory} on:hide={() => showHistory.set(false)} />
  </div>
</div>
