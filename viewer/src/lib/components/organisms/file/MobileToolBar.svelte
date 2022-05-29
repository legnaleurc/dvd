<script lang="ts">
  import { renameNode } from "$lib/tools/api";
  import { getFileSystemContext } from "$lib/stores/filesystem";
  import { getQueueContext } from "$lib/stores/queue";
  import HorizontalToolBar from "$lib/components/molecules/HorizontalToolBar.svelte";

  const { nodeMap, sync } = getFileSystemContext();
  const { moveNodesToPath, trashNodes } = getQueueContext();

  function getNameById(id: string) {
    return $nodeMap[id].name;
  }

  function getMimeTypeById(id: string) {
    return $nodeMap[id].mimeType;
  }

  function isFolderById(id: string) {
    return $nodeMap[id].isFolder;
  }

  async function handleMove(idList: string[], path: string) {
    await moveNodesToPath(idList, path);
    await sync();
  }

  async function handleRename(id: string, name: string) {
    await renameNode(id, name);
    await sync();
  }

  async function handleTrash(idList: string[]) {
    await trashNodes(idList);
    await sync();
  }
</script>

<HorizontalToolBar
  {getNameById}
  {getMimeTypeById}
  {isFolderById}
  renameNode={handleRename}
  trashNodes={handleTrash}
  moveNodesToPath={handleMove}
/>
