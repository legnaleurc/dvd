<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$lib/types/traits";
  import Button from "$lib/components/atoms/Button.svelte";
  import TextInput from "$lib/components/atoms/TextInput.svelte";
  import Modal from "./Modal.svelte";

  type Events = {
    hide: null;
    rename: string;
  };
  type $$Events = SvelteCustomEvents<Events>;

  export let id: string;
  export let getNameById: (id: string) => string;

  const dispatch = createEventDispatcher<Events>();

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
      <TextInput bind:value={newName} on:enterpressed={handleAccept} />
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
