<script lang="ts">
  import { renameNode } from "$lib/tools/api";
  import { getComicContext } from "$lib/stores/comic";
  import { getDisabledContext } from "$lib/stores/disabled";
  import { getFileSystemContext } from "$lib/stores/filesystem";
  import { getQueueContext } from "$lib/stores/queue";
  import { getSelectionContext } from "$lib/stores/selection";
  import { getShortcutContext } from "$lib/stores/shortcut";
  import { getVideoContext } from "$lib/stores/video";
  import HorizontalToolBar from "$lib/components/molecules/HorizontalToolBar.svelte";

  const { openComic } = getComicContext();
  const { disableList, enableList } = getDisabledContext();
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

  async function handleMove(event: CustomEvent<string>) {
    const shortcut = event.detail;
    const idList = Array.from($selectedId);
    disableList(idList);
    deselectList(idList);
    await moveNodesToPath(idList, shortcut);
    await sync();
    enableList(idList);
  }

  async function handleRename(event: CustomEvent<string>) {
    const name = event.detail;
    const idList = Array.from($selectedId);
    const id = idList[0];
    disableList(idList);
    deselectList(idList);
    await renameNode(id, name);
    await sync();
    enableList(idList);
  }
</script>

<HorizontalToolBar
  {getNameById}
  {getMimeTypeById}
  {deselectAll}
  {deselectList}
  {openComic}
  {openVideo}
  {trashNodes}
  selectedId={$selectedId}
  shortcutList={$shortcutList}
  on:move={handleMove}
  on:aftertrash={handleAfterAction}
  on:rename={handleRename}
/>
