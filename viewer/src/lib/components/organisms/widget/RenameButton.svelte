<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { writable } from "svelte/store";

  import type { SvelteCustomEvents } from "$lib/types/traits";
  import { renameNode } from "$lib/tools/api";
  import { getSelectionContext } from "$lib/stores/selection";
  import Icon from "$lib/components/atoms/Icon.svelte";
  import IconButton from "$lib/components/atoms/IconButton.svelte";
  import RenameModal from "./RenameModal.svelte";

  type Events = {
    afterrename: null;
  };
  type $$Events = SvelteCustomEvents<Events>;

  export let getNameById: (id: string) => string;

  const { selectedId, deselectList } = getSelectionContext();
  const dispatch = createEventDispatcher<Events>();

  const renamingId = writable("");

  $: isSelectingOne = $selectedId.size === 1;

  function handleShowRename() {
    const idList = Array.from($selectedId);
    const id = idList[0];
    renamingId.set(id);
  }

  async function handleRename(
    event: CustomEvent<{ id: string; name: string }>,
  ) {
    const { id, name } = event.detail;
    try {
      await renameNode(id, name);
    } catch (e) {
      console.warn("rename", e);
    }
    deselectList([id]);
    dispatch("afterrename");
  }
</script>

<IconButton disabled={!isSelectingOne} on:click={handleShowRename}>
  <Icon name="edit" />
</IconButton>
<RenameModal
  id={$renamingId}
  {getNameById}
  on:hide={() => renamingId.set("")}
  on:rename={handleRename}
/>
