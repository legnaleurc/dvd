<script lang="ts">
  import { getComicContext } from "$lib/stores/comic";
  import { getSelectionContext } from "$lib/stores/selection";
  import IconButton from "$lib/components/atoms/IconButton.svelte";
  import Icon from "$lib/components/atoms/Icon.svelte";

  export let getNameById: (id: string) => string;

  const { openComic } = getComicContext();
  const { selectedId, deselectList } = getSelectionContext();

  $: isSelectionEmpty = $selectedId.size <= 0;

  function handleInternal() {
    const idList = Array.from($selectedId);
    for (const id of idList) {
      const name = getNameById(id);
      openComic(id, name);
    }
    deselectList(idList);
  }
</script>

<IconButton disabled={isSelectionEmpty} on:click={handleInternal}>
  <Icon name="import_contacts" />
</IconButton>
