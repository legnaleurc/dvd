<script lang="ts" context="module">
  import { onMount } from "svelte";
  import { writable } from "svelte/store";

  export function useBodyScrolling() {
    let overflow = "";
    let lock = false;
    return {
      acquire() {
        if (lock) {
          return;
        }
        overflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        lock = true;
      },
      release() {
        if (!lock) {
          return;
        }
        document.body.style.overflow = overflow;
        lock = false;
      },
    };
  }

  export function useMountedStore() {
    const isMounted = writable(false);

    onMount(() => {
      isMounted.set(true);
      return () => {
        isMounted.set(false);
      };
    });

    return isMounted;
  }

  export function useVisibilityChange() {
    function handleVisibilityChange() {
      if (document.hidden) {
        hiddenHandlers.forEach((fn) => fn());
      } else {
        visibleHandlers.forEach((fn) => fn());
      }
    }

    const hiddenHandlers: Array<() => void> = [];
    function onHidden(handler: () => void) {
      hiddenHandlers.push(handler);
    }

    const visibleHandlers: Array<() => void> = [];
    function onVisible(handler: () => void) {
      visibleHandlers.push(handler);
    }

    onMount(() => {
      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
      };
    });

    return {
      onHidden,
      onVisible,
    };
  }
</script>
