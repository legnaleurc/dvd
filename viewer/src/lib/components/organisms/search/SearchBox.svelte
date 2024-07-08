<script lang="ts">
  import { replaceState } from "$app/navigation";
  import { page } from "$app/stores";

  import { getSelectionContext } from "$stores/selection";
  import { getSearchContext } from "$stores/search";
  import SearchInput from "$atoms/SearchInput.svelte";

  let klass = "";
  export { klass as class };
  export let disabled: boolean;

  const { deselectAll } = getSelectionContext();
  const { searchName, historyLoaded } = getSearchContext();

  let nameInput = "";

  function handleSearch() {
    if (!nameInput) {
      return;
    }
    deselectAll();
    searchName(nameInput);
  }

  $: queryName = $page.url.searchParams.get("name");
  $: if (queryName !== null && $historyLoaded) {
    nameInput = queryName;

    const url = $page.url;
    url.searchParams.delete("name");
    replaceState(url, $page.state);

    handleSearch();
  }
</script>

<SearchInput
  class={klass}
  {disabled}
  placeholder="Search"
  bind:value={nameInput}
  on:enterpress={handleSearch}
/>
