<script lang="ts">
  import { getDownloadUrl } from "#tools/api.js";
  import { getSelectionContext } from "#stores/selection.js";
  import Icon from "#atoms/Icon.svelte";
  import RoundedButton from "#atoms/RoundedButton.svelte";

  export let isFolderById: (id: string) => boolean;

  const { selectedId } = getSelectionContext();

  $: isSelectionEmpty = $selectedId.size <= 0;

  async function handleDownload() {
    const idList = Array.from($selectedId);
    for (const id of idList) {
      if (isFolderById(id)) {
        continue;
      }
      const url = getDownloadUrl(id);
      window.open(url, "_blank");
    }
  }
</script>

<RoundedButton disabled={isSelectionEmpty} on:click={handleDownload}>
  <Icon name="file_download" />
</RoundedButton>
