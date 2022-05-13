<script lang="ts" context="module">
  import { onMount } from "svelte";
  import { writable } from "svelte/store";

  export function useBodyScrolling() {
    let overflow: string = "";
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
</script>
