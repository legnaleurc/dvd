<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$types/traits";
  import Icon from "$atoms/Icon.svelte";
  import NodeIcon from "$atoms/NodeIcon.svelte";

  type Events = {
    click: null;
  };
  type $$Events = SvelteCustomEvents<Events>;

  export let category: string;
  export let isFolder: boolean;
  export let loading: boolean;
  export let expanded: boolean;

  const dispatch = createEventDispatcher<Events>();

  function handleClick() {
    if (loading) {
      return;
    }
    dispatch("click");
  }
</script>

<div class="flex" on:click={handleClick}>
  {#if isFolder}
    {#if loading}
      <div class="flex animate-spin">
        <Icon name="hourglass_full" />
      </div>
    {:else if expanded}
      <Icon name="keyboard_arrow_down" />
    {:else}
      <Icon name="keyboard_arrow_right" />
    {/if}
  {:else}
    <NodeIcon {category} />
  {/if}
</div>
