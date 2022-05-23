<script lang="ts">
  import IconButton from "$lib/components/atoms/IconButton.svelte";
  import Icon from "$lib/components/atoms/Icon.svelte";

  export let getNameById: (id: string) => string;
  export let selectedId: Set<string>;
  export let deselectAll: () => void;
  export let openComic: (id: string, name: string) => void;

  $: isSelectionEmpty = selectedId.size <= 0;

  function handleInternal() {
    for (const id of selectedId.values()) {
      const name = getNameById(id);
      openComic(id, name);
    }
    deselectAll();
  }
</script>

<IconButton disabled={isSelectionEmpty} on:click={handleInternal}>
  <Icon name="import_contacts" />
</IconButton>
