<script lang="ts">
  import { getComicContext } from "$lib/stores/comic";
  import { getSearchContext } from "$lib/stores/search";
  import { getSelectionContext } from "$lib/stores/selection";
  import { getVideoContext } from "$lib/stores/video";
  import ToolBar from "$lib/components/organisms/widget/ToolBar.svelte";

  const { openComic } = getComicContext();
  const { resultMap } = getSearchContext();
  const { selectedId, deselectAll } = getSelectionContext();
  const { openVideo } = getVideoContext();

  function getNameById(id: string) {
    return $resultMap[id].name;
  }

  function getMimeTypeById(id: string) {
    return $resultMap[id].mime_type;
  }
</script>

<ToolBar
  {getNameById}
  {getMimeTypeById}
  {deselectAll}
  {openComic}
  {openVideo}
  selectedId={$selectedId}
/>
