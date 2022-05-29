<script lang="ts">
  import { writable } from "svelte/store";

  import { getSelectionContext } from "$lib/stores/selection";
  import { getDisabledContext } from "$lib/stores/disabled";
  import Icon from "$lib/components/atoms/Icon.svelte";
  import IconButton from "$lib/components/atoms/IconButton.svelte";
  import TrashModal from "./TrashModal.svelte";

  export let trashNodes: (idList: string[]) => Promise<void>;

  const { disableList, enableList } = getDisabledContext();
  const { selectedId, deselectList } = getSelectionContext();

  const showTrash = writable(false);

  $: isSelectionEmpty = $selectedId.size <= 0;

  async function handleTrash() {
    const idList = Array.from($selectedId);
    disableList(idList);
    deselectList(idList);
    await trashNodes(idList);
    enableList(idList);
  }
</script>

<IconButton
  variant="danger"
  disabled={isSelectionEmpty}
  on:click={() => showTrash.set(true)}
>
  <Icon name="delete" />
</IconButton>
<TrashModal
  show={$showTrash}
  on:hide={() => showTrash.set(false)}
  on:trash={handleTrash}
/>
