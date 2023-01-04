<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$types/traits";
  import { click } from "$actions/event";
  import Icon from "$atoms/Icon.svelte";
  import NodeIcon from "$atoms/NodeIcon.svelte";

  type $$Events = SvelteCustomEvents<{
    click: null;
  }>;

  export let category: string;
  export let isFolder: boolean;
  export let loading: boolean;
  export let expanded: boolean;

  const dispatch = createEventDispatcher();

  function handleClick() {
    if (loading) {
      return;
    }
    dispatch("click");
  }
</script>

<div role="button" tabindex="0" class="flex" use:click={handleClick}>
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
