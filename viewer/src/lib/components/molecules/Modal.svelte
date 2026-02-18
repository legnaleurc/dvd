<script lang="ts">
  import { createEventDispatcher, onDestroy } from "svelte";

  import type { NeverRecord, SvelteCustomEvents } from "$types/traits";
  import Icon from "$atoms/Icon.svelte";
  import RoundedButton from "$atoms/RoundedButton.svelte";

  type $$Events = SvelteCustomEvents<{
    hide: null;
  }>;
  type $$Slots = {
    title: NeverRecord;
    body: NeverRecord;
    footer: NeverRecord;
  };

  export let show: boolean;

  const dispatch = createEventDispatcher();

  let dialogEl: HTMLDialogElement | null = null;

  // Sync show prop with native dialog state
  $: {
    if (dialogEl) {
      if (show && !dialogEl.open) {
        dialogEl.showModal();
      } else if (!show && dialogEl.open) {
        dialogEl.close();
      }
    }
  }

  // Cleanup: close dialog if unmounted while open
  onDestroy(() => {
    if (dialogEl?.open) {
      dialogEl.close();
    }
  });

  function handleClose() {
    // Dispatch hide event for backward compatibility
    dispatch("hide");
  }

  function handleBackdropClick(event: MouseEvent) {
    // Workaround for missing closedby="any" support in Safari 26
    // Check if click was on dialog element itself (the backdrop area)
    if (event.target === dialogEl) {
      dialogEl?.close();
    }
  }
</script>

<dialog
  bind:this={dialogEl}
  on:close={handleClose}
  on:click={handleBackdropClick}
  class="bg-pale-950"
>
  <div class="modal flex flex-col">
    {#if $$slots.title}
      <div class="modal-header flex font-bold bg-pale-900">
        <div class="flex-1 p-3 flex">
          <slot name="title" />
        </div>
        <div class="flex">
          <RoundedButton on:click={() => dialogEl?.close()}>
            <Icon name="close" />
          </RoundedButton>
        </div>
      </div>
    {/if}
    <div class="modal-body p-3">
      <slot name="body" />
    </div>
    {#if $$slots.footer}
      <div class="modal-footer bg-pale-900">
        <slot name="footer" />
      </div>
    {/if}
  </div>
</dialog>

<style lang="scss">
  dialog[open] {
    // flex flex-col — applied only when open so Tailwind doesn't override display:none
    display: flex;
    flex-direction: column;
  }

  dialog {
    // Remove default dialog styles
    border: none;
    padding: 0;
    max-width: none;
    max-height: none;

    // Center dialog on screen
    margin: auto;

    // Keep existing modal sizing
    max-width: 90%;
    max-height: 90%;
    min-width: 50%;
  }

  // Style the backdrop (replaces bg-black/70)
  dialog::backdrop {
    background-color: rgb(0 0 0 / 0.7);
  }

  .modal {
    max-width: 100%;
    max-height: 100%;
  }
</style>
