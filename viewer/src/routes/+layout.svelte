<script lang="ts">
  import { onMount } from "svelte";

  import { beforeNavigate } from "$app/navigation";

  import { setComicContext } from "#stores/comic.js";
  import { setFullScreenContext } from "#stores/fullscreen.js";
  import { setShortcutContext } from "#stores/shortcut.js";
  import NavBar from "#organisms/NavBar.svelte";
  import MainPage from "#organisms/MainPage.svelte";
  import type { NeverRecord } from "#types/traits.js";

  import "../app.css";

  type $$Slots = {
    default: NeverRecord;
  };

  const { initializeMaxSize } = setComicContext();
  const { isFullScreen } = setFullScreenContext();
  const { loadShortcut } = setShortcutContext();

  beforeNavigate(({ shallow, type }) => {
    if (shallow && type === "goto") return;

    isFullScreen.set(false);
  });

  onMount(() => {
    loadShortcut();
    initializeMaxSize();
  });
</script>

<div class="w-full h-full flex flex-col text-pale-50 bg-pale-950">
  <div class="flex-1 min-h-0"><MainPage><slot></slot></MainPage></div>
  <div><NavBar /></div>
</div>
