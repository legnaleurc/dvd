<script lang="ts">
  import type { SvelteCustomEvents } from "$lib/types/traits";
  import Icon from "$lib/components/atoms/Icon.svelte";
  import IconButton from "$lib/components/atoms/IconButton.svelte";
  import DeselectAllButton from "./DeselectAllButton.svelte";
  import DownloadButton from "./DownloadButton.svelte";
  import ExternalOpenButton from "./ExternalOpenButton.svelte";
  import InternalImageButton from "./InternalImageButton.svelte";
  import InternalVideoButton from "./InternalVideoButton.svelte";
  import CopyUrlButton from "./CopyUrlButton.svelte";
  import RenameButton from "./RenameButton.svelte";
  import ShortcutButton from "./ShortcutButton.svelte";
  import TrashButton from "./TrashButton.svelte";

  type Events = {
    move: string;
    trash: null;
    rename: string;
  };
  type $$Events = SvelteCustomEvents<Events>;

  export let getNameById: (id: string) => string;
  export let getMimeTypeById: (id: string) => string;
  export let isFolderById: (id: string) => boolean;
  export let deselectAll: () => void;
  export let selectedId: Set<string>;
  export let openComic: (id: string, name: string) => void;
  export let openVideo: (id: string) => void;
  export let shortcutList: string[];

  let expand = false;

  function toggleMenu() {
    expand = !expand;
  }
</script>

<div class="flex flex-col bg-paper-800">
  <div class="flex" class:hidden={!expand}>
    <div class="flex-1" />
    <div class="flex-0 flex">
      <CopyUrlButton {getNameById} {isFolderById} {selectedId} />
      <DownloadButton {getNameById} {isFolderById} {selectedId} />
      <ExternalOpenButton {getNameById} {getMimeTypeById} {selectedId} />
      <InternalVideoButton {selectedId} {deselectAll} {openVideo} />
    </div>
  </div>
  <div class="flex">
    <div class="flex-0 flex">
      <DeselectAllButton {selectedId} {deselectAll} />
      <IconButton on:click={toggleMenu}>
        <Icon name={expand ? "expand_less" : "expand_more"} />
      </IconButton>
      <TrashButton {selectedId} on:trash />
    </div>
    <div class="flex-1" />
    <div class="flex-0 flex">
      <RenameButton {getNameById} {selectedId} on:rename />
      <ShortcutButton {selectedId} {shortcutList} on:move />
      <InternalImageButton
        {getNameById}
        {selectedId}
        {deselectAll}
        {openComic}
      />
    </div>
  </div>
</div>
