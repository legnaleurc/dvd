<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$lib/types/traits";
  import { getShortcutContext } from "$lib/stores/shortcut";
  import EmptyBlock from "$lib/components/atoms/EmptyBlock.svelte";
  import MenuList from "$lib/components/molecules/MenuList.svelte";
  import MenuItem from "$lib/components/molecules/MenuItem.svelte";

  type Events = {
    shortcut: string;
  };
  type $$Events = SvelteCustomEvents<Events>;
  type $$Slots = {
    default: {
      showMenu: (x: number, y: number) => void;
    };
  };

  const { shortcutList } = getShortcutContext();
  const dispatch = createEventDispatcher<Events>();
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
