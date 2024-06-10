<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$types/traits";
  import Button from "$atoms/Button.svelte";
  import TextInput from "$atoms/TextInput.svelte";
  import Modal from "$molecules/Modal.svelte";

  type $$Events = SvelteCustomEvents<{
    hide: null;
    rename: string;
  }>;

  export let id: string;
  export let getNameById: (id: string) => string;

  const dispatch = createEventDispatcher();

  let newName = "";

  $: name = id ? getNameById(id) : "";
  $: newName = name;

  function handleAccept() {
    if (!newName) {
      return;
    }
    dispatch("rename", newName);
    dispatch("hide");
  }
</script>

<Modal show={id.length > 0} on:hide>
  <span slot="title">Rename Node</span>
  <div slot="body" class="flex flex-col">
    <div class="break-all p-3 select-text">{getNameById(id)}</div>
    <div class="flex flex-col">
      <TextInput bind:value={newName} on:enterpress={handleAccept} />
    </div>
  </div>
  <div slot="footer">
    <div class="flex">
      <Button
        variant="secondary"
        icon="close"
        on:click={() => dispatch("hide")}
      />
      <div class="flex-1" />
      <Button
        icon="check"
        variant="primary"
        disabled={newName.length <= 0}
        on:click={handleAccept}
      />
    </div>
  </div>
</Modal>
