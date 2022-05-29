<script lang="ts">
  import { writable } from "svelte/store";

  import { getSelectionContext } from "$lib/stores/selection";
  import { getDisabledContext } from "$lib/stores/disabled";
  import Icon from "$lib/components/atoms/Icon.svelte";
  import IconButton from "$lib/components/atoms/IconButton.svelte";
  import RenameModal from "./RenameModal.svelte";

  export let getNameById: (id: string) => string;
  export let renameNode: (id: string, name: string) => Promise<void>;

  const { disableList, enableList } = getDisabledContext();
  const { selectedId, deselectList } = getSelectionContext();

  const renamingId = writable("");

  $: isSelectingOne = $selectedId.size === 1;

  function handleShowRename() {
    const idList = Array.from($selectedId);
    const id = idList[0];
    renamingId.set(id);
  }

  async function handleRename(event: CustomEvent<string>) {
    const name = event.detail;
    const idList = Array.from($selectedId);
    const id = idList[0];
    disableList(idList);
    deselectList(idList);
    await renameNode(id, name);
    enableList(idList);
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
