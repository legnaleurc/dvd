<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$lib/types/traits";
  import { debounce } from "$lib/tools/functional";

  type Events = {
    single: null;
    double: null;
  };
  type $$Events = SvelteCustomEvents<Events>;

  const dispatch = createEventDispatcher<Events>();

  const eventProxy = debounce((clicked: number) => {
    if (clicked >= 2) {
      dispatch("double");
    } else {
      dispatch("single");
    }
  }, 200);

  function handleClick(event: MouseEvent) {
    eventProxy(event.detail);
  }
</script>

<div on:click={handleClick}>
  <slot />
</div>
