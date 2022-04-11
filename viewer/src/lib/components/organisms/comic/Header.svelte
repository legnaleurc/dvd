<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$lib/types/traits";
  import Icon from "$lib/components/atoms/Icon.svelte";
  import IconButton from "$lib/components/atoms/IconButton.svelte";

  type Events = {
    first: null;
    last: null;
  };
  type $$Events = SvelteCustomEvents<Events>;

  export let hidden: boolean;
  export let name: string;

  const dispatch = createEventDispatcher<Events>();
</script>

<div class="flex min-w-0 bg-paper-800" class:hidden>
  <div class="flex-1 p-3 overflow-x-auto whitespace-nowrap select-text">
    {name}
  </div>
  <div class="flex-0">
    <IconButton on:click={() => dispatch("first")}>
      <Icon name="vertical_align_top" />
    </IconButton>
    <IconButton on:click={() => dispatch("last")}>
      <Icon name="vertical_align_bottom" />
    </IconButton>
  </div>
</div>
