<script lang="ts">
  import { onMount } from "svelte";

  import { page } from "$app/stores";
  import { getComicContext } from "$stores/comic";
  import BookList from "./BookList.svelte";
  import ImageList from "./ImageList.svelte";

  type $$Slots = {
    default: Record<string, never>;
  };

  const { idList, comicMap, openComic } = getComicContext();

  $: isMainRoute = $page.route.id === "/comic";
  $: isBookRoute = $page.route.id === "/comic/[comicId]";
  $: comicId = $page.params.comicId ?? "";

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
  <div class="hidden">
    <slot />
  </div>
</div>
