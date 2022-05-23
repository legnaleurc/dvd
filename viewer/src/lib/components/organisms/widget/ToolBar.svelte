<script lang="ts">
  import type { SvelteCustomEvents } from "$lib/types/traits";
  import DeselectAllButton from "$lib/components/molecules/DeselectAllButton.svelte";
  import ExternalOpenButton from "$lib/components/molecules/ExternalOpenButton.svelte";
  import InternalImageButton from "$lib/components/molecules/InternalImageButton.svelte";
  import InternalVideoButton from "$lib/components/molecules/InternalVideoButton.svelte";
  import RenameButton from "$lib/components/molecules/RenameButton.svelte";
  import ShortcutButton from "$lib/components/molecules/ShortcutButton.svelte";
  import TrashButton from "./TrashButton.svelte";

  type Events = {
    aftermove: null;
    aftertrash: null;
    afterrename: null;
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
  export let moveNodesToPath: (
    idList: string[],
    dstPath: string,
  ) => Promise<void>;
</script>

<div class="flex bg-paper-800">
  <div class="flex-0">
    <DeselectAllButton {selectedId} {deselectAll} />
  </div>
  <div class="flex-1" />
  <div class="flex-0">
    <TrashButton on:aftertrash />
    <ExternalOpenButton {getNameById} {getMimeTypeById} {selectedId} />
    <InternalVideoButton {selectedId} {deselectAll} {openVideo} />
    <RenameButton {getNameById} {selectedId} {deselectList} on:afterrename />
    <ShortcutButton
      {selectedId}
      {shortcutList}
      {deselectList}
      {moveNodesToPath}
      on:aftermove
    />
    <InternalImageButton {getNameById} {selectedId} {deselectAll} {openComic} />
  </div>
</div>
