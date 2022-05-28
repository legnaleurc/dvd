<script lang="ts">
  import { writable } from "svelte/store";

  import type { SvelteCustomEvents } from "$lib/types/traits";
  import Icon from "$lib/components/atoms/Icon.svelte";
  import IconButton from "$lib/components/atoms/IconButton.svelte";
  import RenameModal from "./RenameModal.svelte";

  type Events = {
    rename: string;
  };
  type $$Events = SvelteCustomEvents<Events>;

  export let getNameById: (id: string) => string;
  export let selectedId: Set<string>;

  const renamingId = writable("");

  $: isSelectingOne = selectedId.size === 1;

  function handleShowRename() {
    const idList = Array.from(selectedId);
    const id = idList[0];
    renamingId.set(id);
  }
</script>

<IconButton disabled={!isSelectingOne} on:click={handleShowRename}>
  <Icon name="edit" />
</IconButton>
<RenameModal
  id={$renamingId}
  {getNameById}
  on:hide={() => renamingId.set("")}
  on:rename
/>
