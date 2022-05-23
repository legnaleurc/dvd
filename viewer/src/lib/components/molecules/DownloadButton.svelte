<script lang="ts">
  import { getDownloadUrl } from "$lib/tools/api";
  import Icon from "$lib/components/atoms/Icon.svelte";
  import IconButton from "$lib/components/atoms/IconButton.svelte";

  export let isFolderById: (id: string) => boolean;
  export let getNameById: (id: string) => string;
  export let selectedId: Set<string>;

  $: isSelectionEmpty = selectedId.size <= 0;

  async function handleCopyUrl() {
    const idList = Array.from(selectedId);
    for (const id of idList) {
      if (isFolderById(id)) {
        continue;
      }
      const name = getNameById(id);
      const url = getDownloadUrl(id, name);
      window.open(url, "_blank");
    }
  }
</script>

<IconButton disabled={isSelectionEmpty} on:click={handleCopyUrl}>
  <Icon name="file_download" />
</IconButton>
