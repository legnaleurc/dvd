<script lang="ts">
  import { page } from "$app/state";
  import { toStore } from "svelte/store";

  import type { NeverRecord } from "$types/traits";
  import VideoList from "./VideoList.svelte";

  type $$Slots = {
    default: NeverRecord;
  };

  const pageRouteId = toStore(() => page.route.id);

  $: isVideoRoute = $pageRouteId === "/video/[videoId]";
</script>

<div class="w-full h-full">
  <div class="w-full h-full" class:hidden={isVideoRoute}><VideoList /></div>
  <slot></slot>
</div>
