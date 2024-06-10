<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$types/traits";
  import { getSelectionContext } from "$stores/selection";
  import Button from "$atoms/Button.svelte";
  import Modal from "$molecules/Modal.svelte";

  type $$Events = SvelteCustomEvents<{
    hide: null;
    trash: null;
  }>;

  export let show: boolean;

  const { selectedId } = getSelectionContext();
  const dispatch = createEventDispatcher();
</script>

<Modal {show} on:hide>
  <span slot="title">Warning</span>
  <div slot="body">Trashing {$selectedId.size} item(s)!</div>
  <div slot="footer" class="flex">
    <div class="flex-0">
      <Button
        variant="secondary"
        icon="not_interested"
        on:click={() => dispatch("hide")}
      />
    </div>
    <div class="flex-1" />
    <div class="flex-0">
      <Button
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
