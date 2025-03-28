<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$types/traits";
  import { getSelectionContext } from "$stores/selection";
  import Button from "$atoms/Button.svelte";
  import Icon from "$atoms/Icon.svelte";
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
    <div>
      <Button variant="secondary" on:click={() => dispatch("hide")}>
        <Icon name="close" />
      </Button>
    </div>
    <div class="flex-1" />
    <div>
      <Button
        variant="danger"
        on:click={() => {
          dispatch("trash");
          dispatch("hide");
        }}
      >
        <Icon name="delete" />
      </Button>
    </div>
  </div>
</Modal>
