<script lang="ts">
  import { getComicContext } from "$stores/comic";
  import { getSelectionContext } from "$stores/selection";
  import RoundedButton from "$atoms/RoundedButton.svelte";
  import Icon from "$atoms/Icon.svelte";

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

<RoundedButton disabled={isSelectionEmpty} on:click={handleInternal}>
  <Icon name="import_contacts" />
</RoundedButton>
