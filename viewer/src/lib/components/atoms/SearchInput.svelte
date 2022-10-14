<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$types/traits";
  import { inputEvents } from "$actions/input";

  type Events = {
    enterpressed: null;
  };
  type $$Events = SvelteCustomEvents<Events>;

  let klass = "";
  export { klass as class };
  export let value: string = undefined;
  export let placeholder = "";
  export let disabled = false;

  const dispatch = createEventDispatcher<Events>();
</script>

<input
  class="m-3 px-3 bg-black disabled:text-symbol-disabled {klass}"
  type="search"
  {placeholder}
  {disabled}
  use:inputEvents={{
    dispatch,
  }}
  bind:value
/>
