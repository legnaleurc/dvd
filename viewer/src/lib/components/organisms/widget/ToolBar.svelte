<script lang="ts">
  import type { SvelteCustomEvents } from "$lib/types/traits";
  import RenameButton from "./RenameButton.svelte";
  import ShortcutButton from "./ShortcutButton.svelte";
  import TrashButton from "./TrashButton.svelte";
  import DeselectAllButton from "./DeselectAllButton.svelte";
  import ExternalOpenButton from "./ExternalOpenButton.svelte";
  import InternalImageButton from "./InternalImageButton.svelte";
  import InternalVideoButton from "./InternalVideoButton.svelte";

  type Events = {
    aftermove: null;
    aftertrash: null;
    afterrename: null;
  };
  type $$Events = SvelteCustomEvents<Events>;

  export let getNameById: (id: string) => string;
  export let getMimeTypeById: (id: string) => string;
</script>

<div class="flex bg-paper-800">
  <div class="flex-0">
    <DeselectAllButton />
  </div>
  <div class="flex-1" />
  <div class="flex-0">
    <TrashButton on:aftertrash />
    <ExternalOpenButton {getNameById} {getMimeTypeById} />
    <InternalVideoButton />
    <RenameButton {getNameById} on:afterrename />
    <ShortcutButton on:aftermove />
    <InternalImageButton {getNameById} />
  </div>
</div>
