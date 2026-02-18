<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$types/traits";
  import MenuItem from "$molecules/MenuItem.svelte";
  import MenuList from "$molecules/MenuList.svelte";

  type $$Events = SvelteCustomEvents<{
    command: string;
  }>;
  type $$Slots = {
    default: Record<string, never>;
  };

  const MENU_ID = "quick-command-menu";
  const VLC_FOR_WINDOWS = "cmd.exe /c start vlc {url}";
  const VLC_FOR_MACOS = "open -a vlc {url}";
  const VLC_FOR_IOS = "vlc-x-callback://x-callback-url/stream?url={url}";

  const QUICK_LIST: [string, string][] = [
    [VLC_FOR_WINDOWS, "VLC for Windows"],
    [VLC_FOR_MACOS, "VLC for MacOS"],
    [VLC_FOR_IOS, "VLC for iOS"],
  ];

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
    {#each QUICK_LIST as [command, label], index (index)}
      <MenuItem
        on:click={() => {
          dispatch("command", command);
          closeMenu();
        }}
      >
        {label}
      </MenuItem>
    {/each}
  </svelte:fragment>
</MenuList>
