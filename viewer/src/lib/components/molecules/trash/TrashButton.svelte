<script lang="ts">
  import { writable } from "svelte/store";

  import { getSelectionContext } from "$stores/selection";
  import { getDisabledContext } from "$stores/disabled";
  import Icon from "$atoms/Icon.svelte";
  import RoundedButton from "$atoms/RoundedButton.svelte";
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

<RoundedButton
  variant="danger"
  disabled={isSelectionEmpty}
  on:click={() => showTrash.set(true)}
>
  <Icon name="delete" />
</RoundedButton>
<TrashModal
  show={$showTrash}
  on:hide={() => showTrash.set(false)}
  on:trash={handleTrash}
/>
