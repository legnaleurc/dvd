<script lang="ts">
  import { writable } from "svelte/store";

  import type { SvelteCustomEvents } from "$lib/types/traits";
  import Icon from "$lib/components/atoms/Icon.svelte";
  import IconButton from "$lib/components/atoms/IconButton.svelte";
  import ShortcutMenu from "./ShortcutMenu.svelte";
  import ShortcutModal from "./ShortcutModal.svelte";

  type Events = {
    move: string;
  };
  type $$Events = SvelteCustomEvents<Events>;

  export let selectedId: Set<string>;
  export let shortcutList: string[];

  const moveTarget = writable("");

  $: isSelectionEmpty = selectedId.size <= 0;
</script>

<ShortcutMenu
  let:showMenu
  {shortcutList}
  on:shortcut={(event) => moveTarget.set(event.detail)}
>
  <IconButton
    disabled={isSelectionEmpty}
    on:click={(e) => showMenu(e.clientX, e.clientY)}
  >
    <Icon name="drive_file_move" />
  </IconButton>
</ShortcutMenu>
<ShortcutModal
  shortcut={$moveTarget}
  {selectedId}
  on:hide={() => moveTarget.set("")}
  on:move
/>
