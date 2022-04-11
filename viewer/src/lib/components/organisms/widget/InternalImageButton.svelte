<script lang="ts">
  import { getSelectionContext } from "$lib/stores/selection";
  import { getComicContext } from "$lib/stores/comic";
  import IconButton from "$lib/components/atoms/IconButton.svelte";
  import Icon from "$lib/components/atoms/Icon.svelte";

  export let getNameById: (id: string) => string;

  const { selectedId, deselectAll } = getSelectionContext();
  const { openComic } = getComicContext();

  $: isSelectionEmpty = $selectedId.size <= 0;

  function handleInternal() {
    for (const id of $selectedId.values()) {
      const name = getNameById(id);
      openComic(id, name);
    }
    deselectAll();
  }
</script>

<IconButton disabled={isSelectionEmpty} on:click={handleInternal}>
  <Icon name="import_contacts" />
</IconButton>
