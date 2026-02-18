<script lang="ts">
  import { onMount } from "svelte";

  type $$Slots = {
    trigger: Record<string, never>;
    items: Record<string, never>;
  };

  // Unique ID for popover and popovertarget linkage
  export let id: string;

  let popoverEl: HTMLDivElement | null = null;

  onMount(() => {
    // Find the trigger button and set up anchor relationship
    const trigger = popoverEl?.previousElementSibling;
    if (trigger instanceof HTMLElement) {
      // Use setProperty() since these are newer CSS properties not in TypeScript's DOM types
      trigger.style.setProperty("anchor-name", `--menu-trigger-${id}`);
      popoverEl?.style.setProperty("position-anchor", `--menu-trigger-${id}`);
    }
  });
</script>

<slot name="trigger" />
<div
  bind:this={popoverEl}
  {id}
  popover="auto"
  role="menu"
  tabindex="-1"
  class="popover-menu bg-pale-800"
>
  <slot name="items" />
</div>

<style>
  .popover-menu:popover-open {
    /* flex flex-col p-3 — applied only when open so Tailwind doesn't override display:none */
    display: flex;
    flex-direction: column;
    padding: 0.75rem;
  }

  .popover-menu {
    /* Remove default popover styles */
    border: none;
    margin: 0;

    /* Base position: below the trigger, left-aligned (via CSS Anchor Positioning) */
    position: absolute;
    top: anchor(bottom);
    left: anchor(left);

    /* If the base position overflows, try these alternatives */
    position-try-fallbacks:
      --bottom-left,
      --top-right,
      --top-left;
  }

  @position-try --bottom-left {
    top: anchor(bottom);
    right: anchor(right);
  }

  @position-try --top-right {
    bottom: anchor(top);
    left: anchor(left);
  }

  @position-try --top-left {
    bottom: anchor(top);
    right: anchor(right);
  }

  /* Fallback for browsers without CSS Anchor Positioning support */
  @supports not (anchor-name: --foo) {
    .popover-menu {
      /* Center in viewport: position:absolute + all edges 0 + margin:auto */
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      margin: auto;
    }
  }
</style>
