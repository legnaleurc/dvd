<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { writable } from "svelte/store";

  import type { SvelteCustomEvents } from "$lib/types/traits";
  import { getSelectionContext } from "$lib/stores/selection";
  import Icon from "$lib/components/atoms/Icon.svelte";
  import IconButton from "$lib/components/atoms/IconButton.svelte";
  import CreateFolderModal from "./CreateFolderModal.svelte";
  import { createFolder } from "$lib/tools/api";

  type Events = {
    aftercreate: null;
  };
  type $$Events = SvelteCustomEvents<Events>;

  export let getNameById: (id: string) => string;
  export let isFolderById: (id: string) => boolean;
  export let getParentById: (id: string) => string;

  const { selectedId, deselectList } = getSelectionContext();
  const dispatch = createEventDispatcher<Events>();

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
