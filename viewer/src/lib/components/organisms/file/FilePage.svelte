<script lang="ts">
  import { setQueueContext } from "$lib/stores/queue";
  import { setFileSystemContext } from "$lib/stores/filesystem";
  import { setDisabledContext } from "$lib/stores/disabled";
  import LazyLoad from "$lib/components/atoms/LazyLoad.svelte";
  import LoadingBlock from "$lib/components/atoms/LoadingBlock.svelte";

  type $$Slots = {
    default: Record<string, never>;
  };

  setFileSystemContext();
  setQueueContext();
  setDisabledContext();
</script>

<div class="w-full h-full">
  <div class="hidden lg:contents">
    <LazyLoad lazy={() => import("./DesktopPage.svelte")}>
      <LoadingBlock slot="pending" />
    </LazyLoad>
  </div>
  <div class="contents lg:hidden">
    <LazyLoad lazy={() => import("./MobilePage.svelte")}>
      <LoadingBlock slot="pending" />
    </LazyLoad>
  </div>
  <div class="hidden">
    <slot />
  </div>
</div>
