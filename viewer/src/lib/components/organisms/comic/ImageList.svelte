<script lang="ts">
  import { getComicContext } from "$lib/stores/comic";
  import { getImageUrl } from "$lib/tools/api";
  import { getFullScreenContext } from "$lib/stores/fullscreen";
  import Header from "./Header.svelte";

  export let id: string;

  const { comicMap } = getComicContext();
  const { isFullScreen, toggleFullScreen } = getFullScreenContext();

  let container: HTMLDivElement;

  $: data = $comicMap[id];

  function handleFirst() {
    if (!container) {
      return;
    }
    const el = container.firstElementChild;
    if (!el) {
      return;
    }
    el.scrollIntoView();
  }

  function handleLast() {
    if (!container) {
      return;
    }
    const el = container.lastElementChild;
    if (!el) {
      return;
    }
    el.scrollIntoView();
  }
</script>

<div class="w-full h-full flex flex-col">
  <div class="flex-0">
    <Header
      hidden={$isFullScreen}
      name={data.name}
      on:first={handleFirst}
      on:last={handleLast}
    />
  </div>
  <div
    class="flex-1 flex flex-col items-center overflow-y-auto overflow-x-hidden"
    bind:this={container}
    on:click={toggleFullScreen}
  >
    {#each data.imageList as image, index (index)}
      <img
        class="bg-paper-600"
        loading="lazy"
        alt=""
        width={image.width}
        height={image.height}
        src={getImageUrl(id, index)}
      />
    {/each}
  </div>
</div>
