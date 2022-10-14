<script lang="ts">
  import { renameNode } from "$tools/api";
  import { getQueueContext } from "$stores/queue";
  import { getSearchContext } from "$stores/search";
  import HorizontalToolBar from "$molecules/HorizontalToolBar.svelte";

  const { resultMap } = getSearchContext();
  const { moveNodesToPath, trashNodes } = getQueueContext();

  function getNameById(id: string) {
    return $resultMap[id].name;
  }

  function getMimeTypeById(id: string) {
    return $resultMap[id].mime_type;
  }

  function isFolderById(id: string) {
    return $resultMap[id].is_folder;
  }
</script>

<HorizontalToolBar
  {getNameById}
  {getMimeTypeById}
  {isFolderById}
  {renameNode}
  {trashNodes}
  {moveNodesToPath}
/>
