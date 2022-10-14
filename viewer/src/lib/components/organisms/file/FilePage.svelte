<script lang="ts">
  import { setQueueContext } from "$stores/queue";
  import { setFileSystemContext } from "$stores/filesystem";
  import { setDisabledContext } from "$stores/disabled";
  import LazyLoad from "$atoms/LazyLoad.svelte";
  import LoadingBlock from "$atoms/LoadingBlock.svelte";

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
