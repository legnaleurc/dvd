<script lang="ts">
  import type { SvelteCustomEvents } from "$lib/types/traits";
  import DeselectAllButton from "./DeselectAllButton.svelte";
  import ExternalOpenButton from "./ExternalOpenButton.svelte";
  import InternalImageButton from "./InternalImageButton.svelte";
  import InternalVideoButton from "./InternalVideoButton.svelte";
  import RenameButton from "./RenameButton.svelte";
  import ShortcutButton from "./ShortcutButton.svelte";
  import TrashButton from "./TrashButton.svelte";

  type Events = {
    move: string;
    aftertrash: null;
    rename: string;
  };
  type $$Events = SvelteCustomEvents<Events>;

  export let getNameById: (id: string) => string;
  export let getMimeTypeById: (id: string) => string;
  export let deselectAll: () => void;
  export let deselectList: (idList: string[]) => void;
  export let selectedId: Set<string>;
  export let openComic: (id: string, name: string) => void;
  export let openVideo: (id: string) => void;
  export let shortcutList: string[];
  export let trashNodes: (idList: string[]) => Promise<void>;
</script>

<div class="flex bg-paper-800">
  <div class="flex-0">
    <DeselectAllButton {selectedId} {deselectAll} />
  </div>
  <div class="flex-1" />
  <div class="flex-0">
    <TrashButton {selectedId} {deselectList} {trashNodes} on:aftertrash />
    <ExternalOpenButton {getNameById} {getMimeTypeById} {selectedId} />
    <InternalVideoButton {selectedId} {deselectAll} {openVideo} />
    <RenameButton {getNameById} {selectedId} on:rename />
    <ShortcutButton {selectedId} {shortcutList} on:move />
    <InternalImageButton {getNameById} {selectedId} {deselectAll} {openComic} />
  </div>
</div>
