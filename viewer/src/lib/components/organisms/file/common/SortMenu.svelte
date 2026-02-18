<script lang="ts">
  import { getLabel, getSortContext, METHOD_LIST } from "$stores/sort";
  import MenuList from "$molecules/MenuList.svelte";
  import MenuItem from "$molecules/MenuItem.svelte";
  import Icon from "$atoms/Icon.svelte";

  type $$Slots = {
    default: Record<string, never>;
  };

  const MENU_ID = "sort-menu";
  const { method } = getSortContext();

  function closeMenu() {
    const menuEl = document.getElementById(MENU_ID);
    if (menuEl && "hidePopover" in menuEl) {
      (menuEl as HTMLElement & { hidePopover(): void }).hidePopover();
    }
  }
</script>

<MenuList id={MENU_ID}>
  <svelte:fragment slot="trigger">
    <slot />
  </svelte:fragment>
  <svelte:fragment slot="items">
    {#each METHOD_LIST as m (m)}
      <MenuItem
        class="flex"
        on:click={() => {
          method.set(m);
          closeMenu();
        }}
      >
        {#if $method === m}
          <div class="w-6 h-6">
            <Icon name="check" />
          </div>
        {:else}
          <div class="w-6 h-6"></div>
        {/if}
        <div class:font-bold={$method === m}>
          {getLabel(m)}
        </div>
      </MenuItem>
    {/each}
  </svelte:fragment>
</MenuList>
