<script lang="ts">
  import { getLabel, getSortContext, METHOD_LIST } from "$lib/stores/sort";
  import MenuList from "$lib/components/molecules/MenuList.svelte";
  import MenuItem from "$lib/components/molecules/MenuItem.svelte";
  import Icon from "$lib/components/atoms/Icon.svelte";

  type $$Slots = {
    default: {
      show: (x: number, y: number) => void;
    };
  };

  const { method } = getSortContext();
</script>

<MenuList>
  <svelte:fragment slot="trigger" let:show>
    <slot {show} />
  </svelte:fragment>
  <svelte:fragment slot="items" let:hide>
    {#each METHOD_LIST as m (m)}
      <MenuItem
        class="flex"
        on:click={() => {
          method.set(m);
          hide();
        }}
      >
        {#if $method === m}
          <div class="w-6 h-6">
            <Icon name="check" />
          </div>
        {:else}
          <div class="w-6 h-6" />
        {/if}
        <div class:font-bold={$method === m}>
          {getLabel(m)}
        </div>
      </MenuItem>
    {/each}
  </svelte:fragment>
</MenuList>
