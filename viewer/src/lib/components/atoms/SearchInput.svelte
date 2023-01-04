<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$types/traits";
  import { enterpress } from "$actions/event";

  type $$Events = SvelteCustomEvents<{
    enterpress: null;
  }>;

  let klass = "";
  export { klass as class };
  export let value: string = undefined;
  export let placeholder = "";
  export let disabled = false;

  const dispatch = createEventDispatcher();
</script>

<input
  class="m-3 px-3 bg-black disabled:text-symbol-disabled {klass}"
  type="search"
  {placeholder}
  {disabled}
  use:enterpress={() => dispatch("enterpress")}
  bind:value
/>
