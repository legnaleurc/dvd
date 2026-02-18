<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$types/traits";
  import { getShortcutContext } from "$stores/shortcut";
  import EmptyBlock from "$atoms/EmptyBlock.svelte";
  import MenuList from "$molecules/MenuList.svelte";
  import MenuItem from "$molecules/MenuItem.svelte";

  type $$Events = SvelteCustomEvents<{
    shortcut: string;
  }>;
  type $$Slots = {
    default: Record<string, never>;
  };

  const MENU_ID = "shortcut-menu";
  const { shortcutList } = getShortcutContext();
  const dispatch = createEventDispatcher();

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
    {#each $shortcutList as shortcut (shortcut)}
      <MenuItem
        on:click={() => {
          closeMenu();
          dispatch("shortcut", shortcut);
        }}
      >
        {shortcut}
      </MenuItem>
    {:else}
      <EmptyBlock />
    {/each}
  </svelte:fragment>
</MenuList>
