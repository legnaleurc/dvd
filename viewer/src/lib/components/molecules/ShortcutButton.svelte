<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { writable } from "svelte/store";

  import type { SvelteCustomEvents } from "$lib/types/traits";
  import Icon from "$lib/components/atoms/Icon.svelte";
  import IconButton from "$lib/components/atoms/IconButton.svelte";
  import ShortcutMenu from "./ShortcutMenu.svelte";
  import ShortcutModal from "./ShortcutModal.svelte";

  type Events = {
    aftermove: null;
  };
  type $$Events = SvelteCustomEvents<Events>;

  export let selectedId: Set<string>;
  export let deselectList: (idList: string[]) => void;
  export let moveNodesToPath: (
    idList: string[],
    dstPath: string,
  ) => Promise<void>;
  export let shortcutList: string[];

  const dispatch = createEventDispatcher<Events>();

  const moveTarget = writable("");

  $: isSelectionEmpty = selectedId.size <= 0;

  async function handleMove(event: CustomEvent<string>) {
    const shortcut = event.detail;
    const idList = Array.from(selectedId);
    await moveNodesToPath(idList, shortcut);
    deselectList(idList);
    dispatch("aftermove");
  }
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
  on:move={handleMove}
/>
