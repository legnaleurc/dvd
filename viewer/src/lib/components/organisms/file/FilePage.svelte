<script lang="ts">
  import { onMount } from "svelte";

  import { setQueueContext } from "$stores/queue";
  import { setFileSystemContext } from "$stores/filesystem";
  import { setDisabledContext } from "$stores/disabled";
  import LazyLoad from "$atoms/LazyLoad.svelte";
  import LoadingBlock from "$atoms/LoadingBlock.svelte";
  import type { NeverRecord } from "$types/traits";

  type $$Slots = {
    default: NeverRecord;
  };

  const { loadRootAndChildren } = setFileSystemContext();
  const { startQueue, stopQueue } = setQueueContext();
  setDisabledContext();

  onMount(() => {
    startQueue();
    return stopQueue;
  });

  onMount(async () => {
    await loadRootAndChildren();
  });
</script>

<div class="w-full h-full">
  <div class="hidden lg:contents">
    <LazyLoad lazy={() => import("./desktop/DesktopPage.svelte")}>
      <LoadingBlock slot="pending" />
    </LazyLoad>
  </div>
  <div class="contents lg:hidden">
    <LazyLoad lazy={() => import("./mobile/MobilePage.svelte")}>
      <LoadingBlock slot="pending" />
    </LazyLoad>
  </div>
  <div class="hidden">
    <slot />
  </div>
</div>
