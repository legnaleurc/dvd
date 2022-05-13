<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { writable } from "svelte/store";

  import type { SvelteCustomEvents } from "$lib/types/traits";
  import { getQueueContext } from "$lib/stores/queue";
  import { getSelectionContext } from "$lib/stores/selection";
  import Icon from "$lib/components/atoms/Icon.svelte";
  import IconButton from "$lib/components/atoms/IconButton.svelte";
  import ShortcutMenu from "./ShortcutMenu.svelte";
  import ShortcutModal from "./ShortcutModal.svelte";

  type Events = {
    aftermove: null;
  };
  type $$Events = SvelteCustomEvents<Events>;

  const { selectedId, deselectList } = getSelectionContext();
  const { moveNodesToPath } = getQueueContext();
  const dispatch = createEventDispatcher<Events>();

  const moveTarget = writable("");

  $: isSelectionEmpty = $selectedId.size <= 0;

  async function handleMove(event: CustomEvent<string>) {
    const shortcut = event.detail;
    const idList = Array.from($selectedId);
    await moveNodesToPath(idList, shortcut);
    deselectList(idList);
    dispatch("aftermove");
  }
</script>

<ShortcutMenu
  let:showMenu
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
  on:hide={() => moveTarget.set("")}
  on:move={handleMove}
/>
