<script lang="ts">
  import "../app.css";
  import { beforeNavigate } from "$app/navigation";
  import { setFullScreenContext } from "$stores/fullscreen";
  import { setShortcutContext } from "$stores/shortcut";
  import NavBar from "$organisms/NavBar.svelte";
  import MainPage from "$organisms/MainPage.svelte";

  type $$Slots = {
    default: Record<string, never>;
  };

  const { isFullScreen } = setFullScreenContext();
  setShortcutContext();

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
