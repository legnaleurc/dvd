<script lang="ts">
  import { renameNode } from "$tools/api";
  import { getFileSystemContext } from "$stores/filesystem";
  import { getQueueContext } from "$stores/queue";
  import CopyUrlButton from "$molecules/CopyUrlButton.svelte";
  import DeselectAllButton from "$molecules/DeselectAllButton.svelte";
  import DownloadButton from "$molecules/DownloadButton.svelte";
  import InternalImageButton from "$molecules/InternalImageButton.svelte";
  import InternalVideoButton from "$molecules/InternalVideoButton.svelte";
  import RenameButton from "$molecules/rename";
  import TrashButton from "$molecules/trash";
  import SortButton from "$organisms/file/common/SortButton.svelte";
  import CreateFolderButton from "./CreateFolderButton.svelte";

  const { nodeMap, sync } = getFileSystemContext();
  const { trashNodes } = getQueueContext();

  function getNameById(id: string) {
    return $nodeMap[id]?.name ?? "";
  }

  function isFolderById(id: string) {
    return $nodeMap[id]?.isFolder ?? false;
  }

  function getParentById(id: string) {
    return $nodeMap[id].parentId;
  }

  async function handleAfterAction() {
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

<div class="w-full h-full flex flex-col bg-pale-900">
  <div class="flex-0 flex flex-col">
    <SortButton />
    <DeselectAllButton />
  </div>
  <div class="flex-0 flex flex-col overflow-y-auto overflow-x-hidden">
    <InternalImageButton {getNameById} />
    <InternalVideoButton />
    <RenameButton {getNameById} renameNode={handleRename} />
    <CreateFolderButton
      {getNameById}
      {isFolderById}
      {getParentById}
      on:aftercreate={handleAfterAction}
    />
    <DownloadButton {isFolderById} />
    <CopyUrlButton {getNameById} {isFolderById} />
  </div>
  <div class="flex-1" />
  <div class="flex-0 flex flex-col">
    <TrashButton trashNodes={handleTrash} />
  </div>
</div>
