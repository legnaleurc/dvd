<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$types/traits";
  import { inputEvents } from "$actions/input";

  type $$Events = SvelteCustomEvents<{
    enterpressed: null;
  }>;

  let klass = "";
  export { klass as class };
  export let value: string = undefined;
  export let placeholder = "";

  const dispatch = createEventDispatcher();
</script>

<input
  class="m-3 px-3 bg-black {klass}"
  type="text"
  {placeholder}
  use:inputEvents={{
    dispatch,
  }}
  bind:value
/>
