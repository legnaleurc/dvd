<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$types/traits";
  import { getShortcutContext } from "$stores/shortcut";
  import EmptyBlock from "$atoms/EmptyBlock.svelte";
  import MenuList from "./MenuList.svelte";
  import MenuItem from "./MenuItem.svelte";

  type $$Events = SvelteCustomEvents<{
    shortcut: string;
  }>;
  type $$Slots = {
    default: {
      showMenu: (x: number, y: number) => void;
    };
  };

  const { shortcutList } = getShortcutContext();
  const dispatch = createEventDispatcher();
</script>

<MenuList>
  <svelte:fragment slot="trigger" let:show>
    <slot showMenu={show} />
  </svelte:fragment>
  <svelte:fragment slot="items" let:hide>
    {#each $shortcutList as shortcut (shortcut)}
      <MenuItem
        on:click={() => {
          hide();
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
