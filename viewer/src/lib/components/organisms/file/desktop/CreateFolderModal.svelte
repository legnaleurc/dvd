<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$types/traits";
  import Button from "$atoms/Button.svelte";
  import TextInput from "$atoms/TextInput.svelte";
  import Modal from "$molecules/Modal.svelte";

  type $$Events = SvelteCustomEvents<{
    hide: null;
    create: {
      id: string;
      name: string;
    };
  }>;

  export let id: string;
  export let getNameById: (id: string) => string;

  const dispatch = createEventDispatcher();

  let newName = "";

  function handleAccept() {
    if (!newName) {
      return;
    }
    dispatch("create", {
      id,
      name: newName,
    });
    dispatch("hide");
  }
</script>

<Modal show={id.length > 0} on:hide>
  <span slot="title">Create New Folder</span>
  <div slot="body" class="flex flex-col">
    <div class="p-3">Creating Folder to {getNameById(id)}</div>
    <div class="flex flex-col">
      <TextInput bind:value={newName} on:enterpress={handleAccept} />
    </div>
  </div>
  <div slot="footer">
    <div class="flex">
      <Button label="Cancel" icon="close" on:click={() => dispatch("hide")} />
      <div class="flex-1" />
      <Button
        label="OK"
        icon="check"
        variant="primary"
        disabled={newName.length <= 0}
        on:click={handleAccept}
      />
    </div>
  </div>
</Modal>
