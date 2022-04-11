<script lang="ts">
  import { getFileSystemContext } from "$lib/stores/filesystem";
  import ToolBar from "$lib/components/organisms/widget/ToolBar.svelte";

  const { nodeMap, sync } = getFileSystemContext();

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
  on:aftermove={handleAfterAction}
  on:aftertrash={handleAfterAction}
  on:afterrename={handleAfterAction}
/>
