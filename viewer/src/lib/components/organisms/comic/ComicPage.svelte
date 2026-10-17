<script lang="ts">
  import { onMount } from "svelte";
  import { toStore } from "svelte/store";

  import type { NeverRecord } from "#types/traits.js";
  import { page } from "$app/state";
  import { getComicContext } from "#stores/comic.js";
  import BookList from "./BookList.svelte";
  import ImageList from "./ImageList.svelte";

  type $$Slots = {
    default: NeverRecord;
  };

  const { idList, comicMap, openComic } = getComicContext();

  const pageRouteId = toStore(() => page.route.id);
  const pageComicId = toStore(() => page.params.comicId);

  $: isMainRoute = $pageRouteId === "/comic";
  $: isBookRoute = $pageRouteId === "/comic/[comicId]";
  $: comicId = $pageComicId ?? "";

  onMount(() => {
    if (isBookRoute && !$comicMap[comicId]) {
      openComic(comicId, "");
    }
  });
</script>

<div class="w-full h-full flex flex-col">
  <div class="w-full h-full" class:hidden={!isMainRoute}>
    <BookList />
  </div>
  {#each $idList as id (id)}
    {@const isActive = isBookRoute && comicId === id}
    <div class="w-full h-full" class:hidden={!isActive}>
      <ImageList {id} {isActive} />
    </div>
  {/each}

  <div class="hidden"><slot></slot></div>
</div>
