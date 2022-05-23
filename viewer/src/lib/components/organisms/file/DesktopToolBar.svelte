<script lang="ts">
  import { getComicContext } from "$lib/stores/comic";
  import { getFileSystemContext } from "$lib/stores/filesystem";
  import { getQueueContext } from "$lib/stores/queue";
  import { getSelectionContext } from "$lib/stores/selection";
  import { getVideoContext } from "$lib/stores/video";
  import CopyUrlButton from "$lib/components/molecules/CopyUrlButton.svelte";
  import DeselectAllButton from "$lib/components/molecules/DeselectAllButton.svelte";
  import DownloadButton from "$lib/components/molecules/DownloadButton.svelte";
  import InternalImageButton from "$lib/components/molecules/InternalImageButton.svelte";
  import InternalVideoButton from "$lib/components/molecules/InternalVideoButton.svelte";
  import RenameButton from "$lib/components/molecules/RenameButton.svelte";
  import TrashButton from "$lib/components/molecules/TrashButton.svelte";
  import SortButton from "./SortButton.svelte";
  import CreateFolderButton from "./CreateFolderButton.svelte";

  const { openComic } = getComicContext();
  const { nodeMap, sync } = getFileSystemContext();
  const { trashNodes } = getQueueContext();
  const { selectedId, deselectAll, deselectList } = getSelectionContext();
  const { openVideo } = getVideoContext();

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
    <InternalImageButton
      {getNameById}
      selectedId={$selectedId}
      {deselectAll}
      {openComic}
    />
    <InternalVideoButton selectedId={$selectedId} {deselectAll} {openVideo} />
    <RenameButton
      {getNameById}
      selectedId={$selectedId}
      {deselectList}
      on:afterrename={handleAfterAction}
    />
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
    <TrashButton
      selectedId={$selectedId}
      {deselectList}
      {trashNodes}
      on:aftertrash={handleAfterAction}
    />
  </div>
</div>
