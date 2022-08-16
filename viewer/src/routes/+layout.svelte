<script lang="ts">
  import "../app.css";
  import { beforeNavigate } from "$app/navigation";
  import {
    getFullScreenContext,
    setFullScreenContext,
  } from "$lib/stores/fullscreen";
  import { setShortcutContext } from "$lib/stores/shortcut";
  import NavBar from "$lib/components/organisms/NavBar.svelte";
  import MainPage from "$lib/components/organisms/MainPage.svelte";

  setFullScreenContext();
  setShortcutContext();

  const { isFullScreen } = getFullScreenContext();

  beforeNavigate(() => {
    isFullScreen.set(false);
  });
</script>

<div class="w-full h-full flex flex-col bg-paper-900">
  <div class="flex-1 min-h-0">
    <MainPage>
      <slot />
    </MainPage>
  </div>
  <div class="flex-0">
    <NavBar />
  </div>
</div>
