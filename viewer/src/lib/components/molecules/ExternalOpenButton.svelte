<script lang="ts">
  import { callExternal } from "$tools/external";
  import { getSelectionContext } from "$stores/selection";
  import RoundedButton from "$atoms/RoundedButton.svelte";
  import Icon from "$atoms/Icon.svelte";

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

<RoundedButton disabled={!isSelectingOne} on:click={handleExternal}>
  <Icon name="open_in_new" />
</RoundedButton>
