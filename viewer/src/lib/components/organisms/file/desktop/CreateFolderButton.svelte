<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { writable } from "svelte/store";

  import type { SvelteCustomEvents } from "$types/traits";
  import { createFolder } from "$tools/api";
  import { getSelectionContext } from "$stores/selection";
  import Icon from "$atoms/Icon.svelte";
  import IconButton from "$atoms/IconButton.svelte";
  import CreateFolderModal from "./CreateFolderModal.svelte";

  type $$Events = SvelteCustomEvents<{
    aftercreate: null;
  }>;

  export let getNameById: (id: string) => string;
  export let isFolderById: (id: string) => boolean;
  export let getParentById: (id: string) => string;

  const { selectedId, deselectList } = getSelectionContext();
  const dispatch = createEventDispatcher();

  const parentId = writable("");

  $: isSelectingOne = $selectedId.size === 1;

  function handleShowModal() {
    const idList = Array.from($selectedId);
    const id = idList[0];
    if (isFolderById(id)) {
      parentId.set(id);
      return;
    }
    const parent = getParentById(id);
    if (!parent) {
      return;
    }
    parentId.set(parent);
  }

  async function handleCreate(
    event: CustomEvent<{ id: string; name: string }>,
  ) {
    const { id, name } = event.detail;
    try {
      await createFolder(name, id);
    } catch (e) {
      console.warn("create", e);
    }
    deselectList([id]);
    dispatch("aftercreate");
  }
</script>

<IconButton disabled={!isSelectingOne} on:click={handleShowModal}>
  <Icon name="create_new_folder" />
</IconButton>
<CreateFolderModal
  id={$parentId}
  {getNameById}
  on:hide={() => parentId.set("")}
  on:create={handleCreate}
/>
