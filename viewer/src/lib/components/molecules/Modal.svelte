<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$lib/types/traits";
  import Icon from "$lib/components/atoms/Icon.svelte";
  import IconButton from "$lib/components/atoms/IconButton.svelte";
  import {
    useBodyScrolling,
    useMountedStore,
  } from "$lib/components/atoms/LifeCycle.svelte";

  type Events = {
    hide: null;
  };
  type $$Events = SvelteCustomEvents<Events>;
  type $$Slots = {
    title: {};
    body: {};
    footer: {};
  };

  export let show: boolean;

  const dispatch = createEventDispatcher<Events>();
  const bodyScrolling = useBodyScrolling();
  const isMounted = useMountedStore();

  let backdrop: HTMLDivElement = null;

  $: {
    if ($isMounted) {
      if (show) {
        bodyScrolling.acquire();
      } else {
        bodyScrolling.release();
      }
    }
  }
  $: {
    if (backdrop && show) {
      document.body.append(backdrop);
    }
  }

  function hide() {
    dispatch("hide");
  }
</script>

{#if show}
  <div
    class="safe-area-inset-0 fixed flex flex-col justify-center items-center bg-black/70"
    bind:this={backdrop}
    on:click|self={hide}
  >
    <div class="modal flex flex-col bg-paper-900">
      {#if $$slots.title}
        <div class="modal-header flex font-bold bg-paper-800">
          <div class="flex-1 p-3 flex">
            <slot name="title" />
          </div>
          <div class="flex-0 flex">
            <IconButton on:click={hide}>
              <Icon name="close" />
            </IconButton>
          </div>
        </div>
      {/if}
      <div class="modal-body p-3">
        <slot name="body" />
      </div>
      {#if $$slots.footer}
        <div class="modal-footer bg-paper-800">
          <slot name="footer" />
        </div>
      {/if}
    </div>
  </div>
{/if}

<style lang="scss">
  .modal {
    max-width: 90%;
    max-height: 90%;
    min-width: 50%;
  }
</style>
