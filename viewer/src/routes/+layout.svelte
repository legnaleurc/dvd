<script lang="ts">
  import { onMount } from "svelte";

  import { beforeNavigate } from "$app/navigation";

  import { setFullScreenContext } from "$stores/fullscreen";
  import { setShortcutContext } from "$stores/shortcut";
  import NavBar from "$organisms/NavBar.svelte";
  import MainPage from "$organisms/MainPage.svelte";
  import type { NeverRecord } from "$types/traits";

  import "../app.css";

  type $$Slots = {
    default: NeverRecord;
  };

  const { isFullScreen } = setFullScreenContext();
  const { loadShortcut } = setShortcutContext();

  beforeNavigate(() => {
    isFullScreen.set(false);
  });

  onMount(loadShortcut);
</script>

<div class="w-full h-full flex flex-col text-pale-50 bg-pale-950">
  <div class="flex-1 min-h-0">
    <MainPage>
      <slot />
    </MainPage>
  </div>
  <div>
    <NavBar />
  </div>
</div>
