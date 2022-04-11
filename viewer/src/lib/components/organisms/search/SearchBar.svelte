<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { writable } from "svelte/store";

  import type { SvelteCustomEvents } from "$lib/types/traits";
  import Icon from "$lib/components/atoms/Icon.svelte";
  import IconButton from "$lib/components/atoms/IconButton.svelte";
  import SearchInput from "$lib/components/atoms/SearchInput.svelte";
  import HistoryModal from "./HistoryModal.svelte";

  type Events = {
    search: string;
    history: number;
  };
  type $$Events = SvelteCustomEvents<Events>;

  export let historyList: string[];

  const dispatch = createEventDispatcher<Events>();

  let text: string = "";
  const showHistory = writable(false);

  function handleSearch() {
    if (!text) {
      return;
    }
    dispatch("search", text);
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
    <HistoryModal
      show={$showHistory}
      {historyList}
      on:search={(event) => dispatch("history", event.detail)}
      on:hide={() => showHistory.set(false)}
    />
  </div>
</div>
