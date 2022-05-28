<script lang="ts">
  import { renameNode } from "$lib/tools/api";
  import { getComicContext } from "$lib/stores/comic";
  import { getDisabledContext } from "$lib/stores/disabled";
  import { getQueueContext } from "$lib/stores/queue";
  import { getSearchContext } from "$lib/stores/search";
  import { getSelectionContext } from "$lib/stores/selection";
  import { getShortcutContext } from "$lib/stores/shortcut";
  import { getVideoContext } from "$lib/stores/video";
  import HorizontalToolBar from "$lib/components/molecules/HorizontalToolBar.svelte";

  const { openComic } = getComicContext();
  const { disableList, enableList } = getDisabledContext();
  const { resultMap } = getSearchContext();
  const { moveNodesToPath, trashNodes } = getQueueContext();
  const { selectedId, deselectAll, deselectList } = getSelectionContext();
  const { shortcutList } = getShortcutContext();
  const { openVideo } = getVideoContext();

  function getNameById(id: string) {
    return $resultMap[id].name;
  }

  function getMimeTypeById(id: string) {
    return $resultMap[id].mime_type;
  }

  async function handleMove(event: CustomEvent<string>) {
    const shortcut = event.detail;
    const idList = Array.from($selectedId);
    disableList(idList);
    deselectList(idList);
    await moveNodesToPath(idList, shortcut);
    enableList(idList);
  }

  async function handleRename(event: CustomEvent<string>) {
    const name = event.detail;
    const idList = Array.from($selectedId);
    const id = idList[0];
    disableList(idList);
    deselectList(idList);
    await renameNode(id, name);
    enableList(idList);
  }

  async function handleTrash() {
    const idList = Array.from($selectedId);
    disableList(idList);
    deselectList(idList);
    await trashNodes(idList);
    enableList(idList);
  }
</script>

<HorizontalToolBar
  {getNameById}
  {getMimeTypeById}
  {deselectAll}
  {openComic}
  {openVideo}
  shortcutList={$shortcutList}
  selectedId={$selectedId}
  on:move={handleMove}
  on:rename={handleRename}
  on:trash={handleTrash}
/>
