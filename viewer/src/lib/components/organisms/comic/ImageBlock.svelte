<script lang="ts">
  import { retry } from "$actions/image";
  import { observeIntersection } from "$actions/observer";
  import { debounce } from "$tools/fp";

  export let viewport: HTMLElement;
  export let isActive: boolean;
  export let width: number;
  export let height: number;
  export let src: string;

  let srcUrl: string;

  const handleIntersect = debounce((isIntersecting: boolean) => {
    if (isIntersecting) {
      srcUrl = src;
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
  use:observeIntersection={{
    viewport,
    onIntersect: handleIntersect,
    isActive: isActive && !srcUrl,
  }}
/>
