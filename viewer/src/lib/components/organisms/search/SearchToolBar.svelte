<script lang="ts">
  import { getComicContext } from "$lib/stores/comic";
  import { getQueueContext } from "$lib/stores/queue";
  import { getSearchContext } from "$lib/stores/search";
  import { getSelectionContext } from "$lib/stores/selection";
  import { getShortcutContext } from "$lib/stores/shortcut";
  import { getVideoContext } from "$lib/stores/video";
  import HorizontalToolBar from "$lib/components/molecules/HorizontalToolBar.svelte";

  const { openComic } = getComicContext();
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
  shortcutList={$shortcutList}
  selectedId={$selectedId}
/>
