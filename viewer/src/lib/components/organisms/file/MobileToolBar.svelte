<script lang="ts">
  import { getComicContext } from "$lib/stores/comic";
  import { getFileSystemContext } from "$lib/stores/filesystem";
  import { getQueueContext } from "$lib/stores/queue";
  import { getSelectionContext } from "$lib/stores/selection";
  import { getShortcutContext } from "$lib/stores/shortcut";
  import { getVideoContext } from "$lib/stores/video";
  import HorizontalToolBar from "$lib/components/molecules/HorizontalToolBar.svelte";

  const { openComic } = getComicContext();
  const { nodeMap, sync } = getFileSystemContext();
  const { moveNodesToPath, trashNodes } = getQueueContext();
  const { selectedId, deselectAll, deselectList } = getSelectionContext();
  const { shortcutList } = getShortcutContext();
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

<HorizontalToolBar
  {getNameById}
  {getMimeTypeById}
  {deselectAll}
  {deselectList}
  {openComic}
  {openVideo}
  {moveNodesToPath}
  {trashNodes}
  selectedId={$selectedId}
  shortcutList={$shortcutList}
  on:aftermove={handleAfterAction}
  on:aftertrash={handleAfterAction}
  on:afterrename={handleAfterAction}
/>
