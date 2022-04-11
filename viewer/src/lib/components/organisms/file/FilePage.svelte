<script lang="ts">
  import { setQueueContext } from "$lib/stores/queue";
  import { setFileSystemContext } from "$lib/stores/filesystem";
  import MobilePage from "./MobilePage.svelte";
  import DesktopPage from "./DesktopPage.svelte";

  setFileSystemContext();
  setQueueContext();
</script>

<div class="w-full h-full">
  <div class="hidden lg:contents">
    <DesktopPage />
  </div>
  <div class="contents lg:hidden">
    <MobilePage />
  </div>
  <div class="hidden">
    <slot />
  </div>
</div>
