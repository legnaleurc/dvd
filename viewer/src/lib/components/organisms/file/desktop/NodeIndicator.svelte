<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import Icon from "$atoms/Icon.svelte";
  import NodeIcon from "$atoms/NodeIcon.svelte";

  type $$Events = {
    click: CustomEvent<never>;
  };

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

<button class="flex cursor-default" on:click={handleClick}>
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
</button>
