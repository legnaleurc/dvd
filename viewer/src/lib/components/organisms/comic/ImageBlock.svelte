<script lang="ts">
  import { debounce } from "$tools/fp";
  import { retry } from "$actions/image";
  import { observeIntersectionChild } from "$actions/observer";

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
  use:observeIntersectionChild={{
    onIntersect: handleIntersect,
    isActive: isActive && !srcUrl,
  }}
/>
