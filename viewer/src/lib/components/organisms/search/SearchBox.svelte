<script lang="ts">
  import { getSelectionContext } from "$lib/stores/selection";
  import { getSearchContext } from "$lib/stores/search";
  import SearchInput from "$lib/components/atoms/SearchInput.svelte";

  let klass = "";
  export { klass as class };
  export let disabled: boolean;

  const { deselectAll } = getSelectionContext();
  const { searchName } = getSearchContext();

  let text = "";

  function handleSearch() {
    if (!text) {
      return;
    }
    deselectAll();
    searchName(text);
  }
</script>

<SearchInput
  class={klass}
  {disabled}
  placeholder="Search"
  bind:value={text}
  on:enterpressed={handleSearch}
/>
