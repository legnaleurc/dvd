<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$lib/types/traits";
  import Button from "$lib/components/atoms/Button.svelte";
  import Modal from "./Modal.svelte";

  type Events = {
    hide: null;
    trash: null;
  };
  type $$Events = SvelteCustomEvents<Events>;

  export let show: boolean;
  export let selectedId: Set<string>;

  const dispatch = createEventDispatcher<Events>();
</script>

<Modal {show} on:hide>
  <span slot="title">Warning</span>
  <div slot="body">Trashing {selectedId.size} item(s)!</div>
  <div slot="footer" class="flex">
    <div class="flex-0">
      <Button
        label="Cancel"
        icon="not_interested"
        on:click={() => dispatch("hide")}
      />
    </div>
    <div class="flex-1" />
    <div class="flex-0">
      <Button
        label="Trash"
        icon="delete"
        variant="danger"
        on:click={() => {
          dispatch("trash");
          dispatch("hide");
        }}
      />
    </div>
  </div>
</Modal>
