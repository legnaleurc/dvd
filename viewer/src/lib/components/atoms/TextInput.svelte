<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$lib/types/traits";
  import { inputEvents } from "$lib/actions/input";

  type Events = {
    enterpressed: null;
  };
  type $$Events = SvelteCustomEvents<Events>;

  let klass: string = "";
  export { klass as class };
  export let value: string = undefined;
  export let placeholder: string = "";

  const dispatch = createEventDispatcher<Events>();
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
