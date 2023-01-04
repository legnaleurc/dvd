<script lang="ts" context="module">
  function createDummyImage(width: number, height: number) {
    const svg = [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`,
      "</svg>",
    ].join("");
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }
</script>

<script lang="ts">
  import { debounce } from "$tools/fp";
  import { retry } from "$actions/image";
  import { subscribeIntersection } from "$actions/observer";

  export let isActive: boolean;
  export let width: number;
  export let height: number;
  export let src: string;

  let isLazy = true;

  $: srcUrl = isLazy ? createDummyImage(width, height) : src;

  const handleIntersect = debounce((isIntersecting: boolean) => {
    if (isIntersecting) {
      isLazy = false;
    }
  }, 200);
</script>

<img
  draggable="false"
  alt=""
  class="bg-paper-600"
  {width}
  {height}
  src={srcUrl}
  use:retry
  use:subscribeIntersection={{
    onIntersect: handleIntersect,
    isActive: isActive && isLazy,
  }}
/>
