<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$types/traits";
  import Icon from "$atoms/Icon.svelte";
  import IconButton from "$atoms/IconButton.svelte";

  type $$Events = SvelteCustomEvents<{
    first: null;
    last: null;
  }>;

  export let hidden: boolean;
  export let name: string;

  const dispatch = createEventDispatcher();
</script>

<div class="flex min-w-0 bg-pale-900" class:hidden>
  <div class="flex-1 p-3 overflow-x-auto whitespace-nowrap select-text">
    {name}
  </div>
  <div class="flex-0 flex">
    <IconButton on:click={() => dispatch("first")}>
      <Icon name="vertical_align_top" />
    </IconButton>
    <IconButton on:click={() => dispatch("last")}>
      <Icon name="vertical_align_bottom" />
    </IconButton>
  </div>
</div>
