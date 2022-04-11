<script lang="ts">
  import { page } from "$app/stores";
  import VideoList from "./VideoList.svelte";

  $: isVideoRoute = $page.routeId === "video/[videoId]";
</script>

<div class="w-full h-full">
  <div class="w-full h-full" class:hidden={isVideoRoute}>
    <VideoList />
  </div>
  <slot />
</div>
