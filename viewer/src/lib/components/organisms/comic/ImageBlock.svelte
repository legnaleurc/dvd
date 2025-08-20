<script lang="ts">
  import { debounce } from "$tools/fp";
  import { retry } from "$actions/image";
  import { subscribeIntersection } from "$actions/observer";

  export let isActive: boolean;
  export let width: number;
  export let height: number;
  export let src: string;

  let isLazy = true;

  const handleIntersect = debounce((isIntersecting: boolean) => {
    isLazy = !isIntersecting;
  }, 200);
</script>

{#if isLazy}
  <div
    class="bg-pale-700 placeholder"
    style:--width={width}
    style:--height={height}
    use:subscribeIntersection={{
      onIntersect: handleIntersect,
      isActive,
    }}
  ></div>
{:else}
  <img
    draggable="false"
    alt=""
    class="bg-pale-700"
    {width}
    {height}
    {src}
    use:retry
    use:subscribeIntersection={{
      onIntersect: handleIntersect,
      isActive,
    }}
  />
{/if}

<style lang="scss">
  .placeholder {
    width: calc(var(--width) * 1px);
    max-width: 100%;
    aspect-ratio: var(--width) / var(--height);
  }
</style>
