<script lang="ts">
  import { writable } from "svelte/store";

  import type { SvelteCustomEvents } from "$lib/types/traits";
  import Icon from "$lib/components/atoms/Icon.svelte";
  import IconButton from "$lib/components/atoms/IconButton.svelte";
  import TrashModal from "./TrashModal.svelte";

  type Events = {
    trash: null;
  };
  type $$Events = SvelteCustomEvents<Events>;

  export let selectedId: Set<string>;

  const showTrash = writable(false);

  $: isSelectionEmpty = selectedId.size <= 0;
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
  on:trash
/>
