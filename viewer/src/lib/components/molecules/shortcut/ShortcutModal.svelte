<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$types/traits";
  import { getSelectionContext } from "$stores/selection";
  import Button from "$atoms/Button.svelte";
  import Modal from "$molecules/Modal.svelte";

  type $$Events = SvelteCustomEvents<{
    hide: null;
    move: string;
  }>;

  export let shortcut: string;

  const { selectedId } = getSelectionContext();
  const dispatch = createEventDispatcher();
</script>

<Modal show={shortcut.length > 0} on:hide>
  <span slot="title">Warning</span>
  <div slot="body">About to move {$selectedId.size} item(s) to {shortcut}!</div>
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
        label="OK"
        icon="check"
        variant="primary"
        on:click={() => {
          dispatch("move", shortcut);
          dispatch("hide");
        }}
      />
    </div>
  </div>
</Modal>
