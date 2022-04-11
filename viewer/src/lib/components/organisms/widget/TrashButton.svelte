<script lang="ts">
  import Icon from "$lib/components/atoms/Icon.svelte";

  import IconButton from "$lib/components/atoms/IconButton.svelte";
  import { getQueueContext } from "$lib/stores/queue";
  import { getSelectionContext } from "$lib/stores/selection";

  import type { SvelteCustomEvents } from "$lib/types/traits";
  import { createEventDispatcher } from "svelte";
  import { writable } from "svelte/store";

  import TrashModal from "./TrashModal.svelte";

  type Events = {
    aftertrash: null;
  };
  type $$Events = SvelteCustomEvents<Events>;

  const { selectedId, deselectList } = getSelectionContext();
  const { trashNodes } = getQueueContext();
  const dispatch = createEventDispatcher<Events>();

  const showTrash = writable(false);

  $: isSelectionEmpty = $selectedId.size <= 0;

  async function handleTrash() {
    const idList = Array.from($selectedId);
    await trashNodes(idList);
    deselectList(idList);
    dispatch("aftertrash");
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
