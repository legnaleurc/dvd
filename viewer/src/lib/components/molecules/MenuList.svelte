<script lang="ts">
  import { onDestroy } from "svelte";
  import { useBodyScrolling, useMountedStore } from "$atoms/LifeCycle.svelte";

  type $$Slots = {
    trigger: {
      show: (cursorX: number, cursorY: number) => void;
    };
    items: {
      hide: () => void;
    };
  };

  type Range = [number, number];

  const bodyScrolling = useBodyScrolling();
  const isMounted = useMountedStore();

  let rootEl: HTMLDivElement = null;
  let menuEl: HTMLDivElement = null;
  let present: boolean;
  let cursorX = 0;
  let cursorY = 0;

  function show(x: number, y: number) {
    cursorX = x;
    cursorY = y;
    present = true;
  }

  function hide() {
    present = false;
    cursorX = 0;
    cursorY = 0;
  }

  function adjustPosition() {
    if (!menuEl || !rootEl) {
      return;
    }
    const xRange: Range = [0, rootEl.clientWidth];
    const yRange: Range = [0, rootEl.clientHeight];
    const boundary = menuEl.getBoundingClientRect();

    // try right-side first
    if (inRange(cursorX + boundary.width, xRange)) {
      menuEl.style.left = `${cursorX}px`;
    } else if (inRange(cursorX - boundary.width, xRange)) {
      menuEl.style.left = `${cursorX - boundary.width}px`;
    } else {
      menuEl.style.left = `${cursorX}px`;
    }
    // try bottom-side first
    if (inRange(cursorY + boundary.height, yRange)) {
      menuEl.style.top = `${cursorY}px`;
    } else if (inRange(cursorY - boundary.height, yRange)) {
      menuEl.style.top = `${cursorY - boundary.height}px`;
    } else {
      menuEl.style.top = `${cursorY}px`;
    }

    menuEl.classList.remove("invisible");
  }

  function inRange(n: number, range: Range) {
    return range[0] <= n && n < range[1];
  }

  // It is possible to unmount without hide(), e.g. the parent was unmounted.
  // In this case we need to manually cleanup detached elements and global
  // styles.
  onDestroy(() => {
    if (present) {
      rootEl.remove();
    }
    bodyScrolling.release();
  });

  $: {
    if ($isMounted) {
      if (present) {
        bodyScrolling.acquire();
      } else {
        bodyScrolling.release();
      }
    }
  }
  $: {
    if (rootEl && menuEl && present) {
      document.body.append(rootEl);
      adjustPosition();
    }
  }
</script>

<slot name="trigger" {show} />
{#if present}
  <div
    role="presentation"
    class="safe-area-inset-0 fixed overflow-hidden"
    bind:this={rootEl}
    on:click|self={hide}
  >
    <div
      role="menu"
      tabindex="-1"
      class="absolute invisible p-3 flex flex-col bg-pale-800"
      bind:this={menuEl}
    >
      <slot name="items" {hide} />
    </div>
  </div>
{/if}
