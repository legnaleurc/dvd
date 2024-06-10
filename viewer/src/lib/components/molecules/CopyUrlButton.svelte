<script lang="ts">
  import { getStreamUrl } from "$tools/api";
  import { getSelectionContext } from "$stores/selection";
  import Icon from "$atoms/Icon.svelte";
  import RoundedButton from "$atoms/RoundedButton.svelte";

  export let isFolderById: (id: string) => boolean;
  export let getNameById: (id: string) => string;

  const { selectedId } = getSelectionContext();

  $: isSelectionEmpty = $selectedId.size <= 0;

  async function handleCopyUrl() {
    const idList = Array.from($selectedId);
    const fileList = idList.filter((id) => !isFolderById(id));
    const urlList = fileList.map((id) => {
      const name = getNameById(id);
      return getStreamUrl(id, name);
    });
    const text = urlList.join("\n");
    await window.navigator.clipboard.writeText(text);
  }
</script>

<RoundedButton disabled={isSelectionEmpty} on:click={handleCopyUrl}>
  <Icon name="content_copy" />
</RoundedButton>
