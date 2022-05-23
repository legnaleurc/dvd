<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { writable } from "svelte/store";

  import type { SvelteCustomEvents } from "$lib/types/traits";
  import Icon from "$lib/components/atoms/Icon.svelte";
  import IconButton from "$lib/components/atoms/IconButton.svelte";
  import TrashModal from "./TrashModal.svelte";

  type Events = {
    aftertrash: null;
  };
  type $$Events = SvelteCustomEvents<Events>;

  export let selectedId: Set<string>;
  export let deselectList: (idList: string[]) => void;
  export let trashNodes: (idList: string[]) => Promise<void>;

  const dispatch = createEventDispatcher<Events>();

  const showTrash = writable(false);

  $: isSelectionEmpty = selectedId.size <= 0;

  async function handleTrash() {
    const idList = Array.from(selectedId);
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
  {selectedId}
  on:hide={() => showTrash.set(false)}
  on:trash={handleTrash}
/>
