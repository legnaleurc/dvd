<script lang="ts">
  import { getComicContext } from "$lib/stores/comic";
  import { getFileSystemContext } from "$lib/stores/filesystem";
  import { getSelectionContext } from "$lib/stores/selection";
  import { getVideoContext } from "$lib/stores/video";
  import ToolBar from "$lib/components/organisms/widget/ToolBar.svelte";

  const { openComic } = getComicContext();
  const { nodeMap, sync } = getFileSystemContext();
  const { selectedId, deselectAll } = getSelectionContext();
  const { openVideo } = getVideoContext();

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
  {openVideo}
  selectedId={$selectedId}
  on:aftermove={handleAfterAction}
  on:aftertrash={handleAfterAction}
  on:afterrename={handleAfterAction}
/>
