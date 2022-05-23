<script lang="ts">
  import { getComicContext } from "$lib/stores/comic";
  import { getFileSystemContext } from "$lib/stores/filesystem";
  import { getSelectionContext } from "$lib/stores/selection";
  import ToolBar from "$lib/components/organisms/widget/ToolBar.svelte";

  const { openComic } = getComicContext();
  const { nodeMap, sync } = getFileSystemContext();
  const { selectedId, deselectAll } = getSelectionContext();

  function getNameById(id: string) {
    return $nodeMap[id]?.name ?? "";
  }

  function getMimeTypeById(id: string) {
    return $nodeMap[id]?.mimeType ?? "";
  }

  async function handleAfterAction() {
    await sync();
  }
</script>

<ToolBar
  {getNameById}
  {getMimeTypeById}
  {deselectAll}
  {openComic}
  selectedId={$selectedId}
  on:aftermove={handleAfterAction}
  on:aftertrash={handleAfterAction}
  on:afterrename={handleAfterAction}
/>
