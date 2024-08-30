<script lang="ts">
  import { getSelectionContext } from "$stores/selection";
  import { getSearchContext } from "$stores/search";
  import SearchInput from "$atoms/SearchInput.svelte";

  let klass = "";
  export { klass as class };
  export let disabled: boolean;

  const { deselectAll } = getSelectionContext();
  const { searchName, nameInput } = getSearchContext();

  function handleSearch() {
    if (!$nameInput) {
      return;
    }
    deselectAll();
    searchName($nameInput);
  }
</script>

<SearchInput
  class={klass}
  {disabled}
  placeholder="Search"
  bind:value={$nameInput}
  on:enterpress={handleSearch}
/>
