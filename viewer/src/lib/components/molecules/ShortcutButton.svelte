<script lang="ts">
  import { writable } from "svelte/store";

  import { getSelectionContext } from "$lib/stores/selection";
  import { getDisabledContext } from "$lib/stores/disabled";
  import Icon from "$lib/components/atoms/Icon.svelte";
  import IconButton from "$lib/components/atoms/IconButton.svelte";
  import ShortcutMenu from "./ShortcutMenu.svelte";
  import ShortcutModal from "./ShortcutModal.svelte";

  export let moveNodesToPath: (idList: string[], path: string) => Promise<void>;

  const { disableList, enableList } = getDisabledContext();
  const { selectedId, deselectList } = getSelectionContext();

  const moveTarget = writable("");

  $: isSelectionEmpty = $selectedId.size <= 0;

  async function handleMove(event: CustomEvent<string>) {
    const shortcut = event.detail;
    const idList = Array.from($selectedId);
    disableList(idList);
    deselectList(idList);
    await moveNodesToPath(idList, shortcut);
    enableList(idList);
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
