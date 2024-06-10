<script lang="ts">
  import { writable } from "svelte/store";

  import { getSelectionContext } from "$stores/selection";
  import { getDisabledContext } from "$stores/disabled";
  import Icon from "$atoms/Icon.svelte";
  import RoundedButton from "$atoms/RoundedButton.svelte";
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

<RoundedButton disabled={!isSelectingOne} on:click={handleShowRename}>
  <Icon name="edit" />
</RoundedButton>
<RenameModal
  id={$renamingId}
  {getNameById}
  on:hide={() => renamingId.set("")}
  on:rename={handleRename}
/>
