<script lang="ts">
  import { callExternal } from "$lib/tools/external";
  import { getSelectionContext } from "$lib/stores/selection";
  import IconButton from "$lib/components/atoms/IconButton.svelte";
  import Icon from "$lib/components/atoms/Icon.svelte";

  export let getNameById: (id: string) => string;
  export let getMimeTypeById: (id: string) => string;

  const { selectedId } = getSelectionContext();

  async function handleExternal() {
    const idList = Array.from($selectedId);
    const id = idList[0];
    const name = getNameById(id);
    const mimeType = getMimeTypeById(id);
    await callExternal(id, name, mimeType);
  }

  $: isSelectingOne = $selectedId.size === 1;
</script>

<IconButton disabled={!isSelectingOne} on:click={handleExternal}>
  <Icon name="open_in_new" />
</IconButton>
