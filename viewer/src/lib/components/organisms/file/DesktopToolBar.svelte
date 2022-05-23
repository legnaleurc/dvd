<script lang="ts">
  import { getFileSystemContext } from "$lib/stores/filesystem";
  import { getSelectionContext } from "$lib/stores/selection";
  import CopyUrlButton from "$lib/components/molecules/CopyUrlButton.svelte";
  import DeselectAllButton from "$lib/components/molecules/DeselectAllButton.svelte";
  import DownloadButton from "$lib/components/molecules/DownloadButton.svelte";
  import RenameButton from "$lib/components/organisms/widget/RenameButton.svelte";
  import TrashButton from "$lib/components/organisms/widget/TrashButton.svelte";
  import InternalImageButton from "$lib/components/organisms/widget/InternalImageButton.svelte";
  import InternalVideoButton from "$lib/components/organisms/widget/InternalVideoButton.svelte";
  import SortButton from "./SortButton.svelte";
  import CreateFolderButton from "./CreateFolderButton.svelte";

  const { nodeMap, sync } = getFileSystemContext();
  const { selectedId, deselectAll } = getSelectionContext();

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
</script>

<div class="w-full h-full flex flex-col bg-paper-800">
  <div class="flex-0 flex flex-col">
    <SortButton />
    <DeselectAllButton selectedId={$selectedId} {deselectAll} />
    <InternalImageButton {getNameById} />
    <InternalVideoButton />
    <RenameButton {getNameById} on:afterrename={handleAfterAction} />
    <CreateFolderButton
      {getNameById}
      {isFolderById}
      {getParentById}
      on:aftercreate={handleAfterAction}
    />
    <DownloadButton {getNameById} {isFolderById} selectedId={$selectedId} />
    <CopyUrlButton {getNameById} {isFolderById} selectedId={$selectedId} />
  </div>
  <div class="flex-1" />
  <div class="flex-0 flex flex-col">
    <TrashButton on:aftertrash={handleAfterAction} />
  </div>
</div>
