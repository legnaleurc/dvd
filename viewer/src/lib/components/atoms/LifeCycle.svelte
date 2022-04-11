<script lang="ts" context="module">
  import { onMount } from "svelte";
  import { writable } from "svelte/store";

  export function useBodyScrolling() {
    let overflow: string = "";
    return {
      acquire() {
        overflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
      },
      release() {
        document.body.style.overflow = overflow;
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
