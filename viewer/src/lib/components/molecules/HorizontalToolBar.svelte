<script lang="ts">
  import Icon from "$atoms/Icon.svelte";
  import RoundedButton from "$atoms/RoundedButton.svelte";
  import DeselectAllButton from "./DeselectAllButton.svelte";
  import DownloadButton from "./DownloadButton.svelte";
  import ExternalOpenButton from "./ExternalOpenButton.svelte";
  import InternalImageButton from "./InternalImageButton.svelte";
  import InternalVideoButton from "./InternalVideoButton.svelte";
  import CopyUrlButton from "./CopyUrlButton.svelte";
  import RenameButton from "./rename";
  import ShortcutButton from "./shortcut";
  import TrashButton from "./trash";

  export let getNameById: (id: string) => string;
  export let getMimeTypeById: (id: string) => string;
  export let isFolderById: (id: string) => boolean;
  export let renameNode: (id: string, name: string) => Promise<void>;
  export let trashNodes: (idList: string[]) => Promise<void>;
  export let moveNodesToPath: (idList: string[], path: string) => Promise<void>;

  let expand = false;

  function toggleMenu() {
    expand = !expand;
  }
</script>

<div class="flex flex-col bg-pale-900">
  <div class="flex" class:hidden={!expand}>
    <div class="flex-1"></div>
    <div class="flex">
      <CopyUrlButton {getNameById} {isFolderById} />
      <DownloadButton {isFolderById} />
      <ExternalOpenButton {getNameById} {getMimeTypeById} />
    </div>
  </div>
  <div class="flex">
    <div class="flex">
      <DeselectAllButton />
      <RoundedButton on:click={toggleMenu}>
        <Icon name={expand ? "expand_less" : "expand_more"} />
      </RoundedButton>
      <TrashButton {trashNodes} />
    </div>
    <div class="flex-1"></div>
    <div class="flex">
      <InternalVideoButton />
      <RenameButton {getNameById} {renameNode} />
      <ShortcutButton {moveNodesToPath} />
      <InternalImageButton {getNameById} />
    </div>
  </div>
</div>
