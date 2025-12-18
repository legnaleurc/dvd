<script lang="ts">
  import { getImageUrl } from "$tools/api";
  import { getComicContext } from "$stores/comic";
  import { getFullScreenContext } from "$stores/fullscreen";
  import { publishIntersection } from "$actions/observer";
  import Header from "./Header.svelte";
  import ImageBlock from "./ImageBlock.svelte";

  export let id: string;
  export let isActive: boolean;

  const { comicMap, maxSize } = getComicContext();
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
  <div>
    <Header
      hidden={$isFullScreen}
      name={data.name}
      on:first={handleFirst}
      on:last={handleLast}
    />
  </div>
  <div
    role="presentation"
    class="flex-1 flex flex-col items-center overflow-y-auto overflow-x-hidden"
    bind:this={container}
    on:click={toggleFullScreen}
    use:publishIntersection
  >
    {#each data.imageList as image, index (index)}
      <ImageBlock
        {isActive}
        width={image.width}
        height={image.height}
        src={getImageUrl(id, index, $maxSize)}
      />
    {/each}
  </div>
</div>
