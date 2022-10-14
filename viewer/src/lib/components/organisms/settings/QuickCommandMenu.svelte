<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$types/traits";
  import MenuItem from "$molecules/MenuItem.svelte";
  import MenuList from "$molecules/MenuList.svelte";

  type Events = {
    command: string;
  };
  type $$Events = SvelteCustomEvents<Events>;
  type $$Slots = {
    default: {
      showMenu: (x: number, y: number) => void;
    };
  };

  const VLC_FOR_WINDOWS = "cmd.exe /c start vlc {url}";
  const VLC_FOR_MACOS = "open -a vlc {url}";
  const VLC_FOR_IOS = "vlc-x-callback://x-callback-url/stream?url={url}";

  const QUICK_LIST: [string, string][] = [
    [VLC_FOR_WINDOWS, "VLC for Windows"],
    [VLC_FOR_MACOS, "VLC for MacOS"],
    [VLC_FOR_IOS, "VLC for iOS"],
  ];

  const dispatch = createEventDispatcher<Events>();
</script>

<MenuList>
  <svelte:fragment slot="trigger" let:show>
    <slot showMenu={show} />
  </svelte:fragment>
  <svelte:fragment slot="items" let:hide>
    {#each QUICK_LIST as [command, label], index (index)}
      <MenuItem
        on:click={() => {
          dispatch("command", command);
          hide();
        }}
      >
        {label}
      </MenuItem>
    {/each}
  </svelte:fragment>
</MenuList>
