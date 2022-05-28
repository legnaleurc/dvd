<script lang="ts">
  import type { SvelteCustomEvents } from "$lib/types/traits";
  import DeselectAllButton from "./DeselectAllButton.svelte";
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
</script>

<div class="flex bg-paper-800">
  <div class="flex-0 flex">
    <DeselectAllButton {selectedId} {deselectAll} />
    <TrashButton {selectedId} on:trash />
  </div>
  <div class="flex-1" />
  <div class="flex-0 flex overflow-x-auto overflow-y-hidden">
    <CopyUrlButton {getNameById} {isFolderById} {selectedId} />
    <ExternalOpenButton {getNameById} {getMimeTypeById} {selectedId} />
    <InternalVideoButton {selectedId} {deselectAll} {openVideo} />
  </div>
  <div class="flex-0 flex">
    <RenameButton {getNameById} {selectedId} on:rename />
    <ShortcutButton {selectedId} {shortcutList} on:move />
    <InternalImageButton {getNameById} {selectedId} {deselectAll} {openComic} />
  </div>
</div>
