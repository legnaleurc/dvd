<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$types/traits";
  import { click } from "$actions/event";

  type $$Events = SvelteCustomEvents<{
    click: null;
  }>;

  let klass = "";
  export { klass as class };

  const dispatch = createEventDispatcher();
</script>

<div
  role="menuitem"
  tabindex="0"
  class="p-3 cursor-pointer hover:bg-action-hover {klass}"
  use:click={() => dispatch("click")}
>
  <slot />
</div>
