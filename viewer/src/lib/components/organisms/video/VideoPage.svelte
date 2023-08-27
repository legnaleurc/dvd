<script lang="ts">
  import { page } from "$app/stores";

  import type { NeverRecord } from "$types/traits";
  import VideoList from "./VideoList.svelte";

  type $$Slots = {
    default: NeverRecord;
  };

  $: isVideoRoute = $page.route.id === "/video/[videoId]";
</script>

<div class="w-full h-full">
  <div class="w-full h-full" class:hidden={isVideoRoute}>
    <VideoList />
  </div>
  <slot />
</div>
