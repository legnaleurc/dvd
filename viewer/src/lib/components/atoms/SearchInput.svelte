<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$types/traits";
  import { enterpress } from "$actions/event";

  type $$Events = SvelteCustomEvents<{
    enterpress: null;
  }>;

  let klass = "";
  export { klass as class };
  export let value: string | undefined = undefined;
  export let placeholder = "";
  export let disabled = false;

  const dispatch = createEventDispatcher();

  function handleEnterPress(event: KeyboardEvent) {
    const self = event.currentTarget as HTMLInputElement;
    dispatch("enterpress");
    // Dismiss keyboard in iOS 26.
    self.blur();
  }
</script>

<input
  class="m-3 px-3 bg-black disabled:text-pale-400 {klass}"
  type="search"
  enterkeyhint="search"
  {placeholder}
  {disabled}
  use:enterpress={handleEnterPress}
  bind:value
/>
