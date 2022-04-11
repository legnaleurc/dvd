<script lang="ts">
  import { getFileSystemContext } from "$lib/stores/filesystem";
  import RenameButton from "$lib/components/organisms/widget/RenameButton.svelte";
  import TrashButton from "$lib/components/organisms/widget/TrashButton.svelte";
  import DeselectAllButton from "$lib/components/organisms/widget/DeselectAllButton.svelte";
  import InternalImageButton from "$lib/components/organisms/widget/InternalImageButton.svelte";
  import CopyUrlButton from "$lib/components/organisms/widget/CopyUrlButton.svelte";
  import DownloadButton from "$lib/components/organisms/widget/DownloadButton.svelte";
  import InternalVideoButton from "$lib/components/organisms/widget/InternalVideoButton.svelte";
  import SortButton from "./SortButton.svelte";
  import CreateFolderButton from "./CreateFolderButton.svelte";

  const { nodeMap, sync } = getFileSystemContext();

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
    <DeselectAllButton />
    <InternalImageButton {getNameById} />
    <InternalVideoButton />
    <RenameButton {getNameById} on:afterrename={handleAfterAction} />
    <CreateFolderButton
      {getNameById}
      {isFolderById}
      {getParentById}
      on:aftercreate={handleAfterAction}
    />
    <DownloadButton {getNameById} {isFolderById} />
    <CopyUrlButton {getNameById} {isFolderById} />
  </div>
  <div class="flex-1" />
  <div class="flex-0 flex flex-col">
    <TrashButton on:aftertrash={handleAfterAction} />
  </div>
</div>
