<script lang="ts">
  export let width: number;
  export let height: number;
  export let src: string;

  let retry = 0;
  let srcUrl = src;

  function handleError() {
    if (retry > 3) {
      return;
    }
    const url = new URL(src);
    const hash = `${++retry}_${Date.now()}`;
    url.searchParams.set("_retry", hash);
    srcUrl = url.toString();
  }
</script>

<img
  draggable="false"
  class="bg-paper-600"
  loading="lazy"
  alt=""
  {width}
  {height}
  src={srcUrl}
  on:error={handleError}
/>
