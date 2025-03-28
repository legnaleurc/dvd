<script lang="ts">
  import { onMount } from "svelte";

  import { page } from "$app/stores";
  import { getVideoContext } from "$stores/video";
  import { getStreamUrl } from "$tools/api";
  import { callExternal } from "$tools/external";
  import RoundedButton from "$atoms/RoundedButton.svelte";
  import Icon from "$atoms/Icon.svelte";

  const { videoMap, openVideo } = getVideoContext();

  let url = "";

  $: id = $page.params.videoId;
  $: video = $videoMap[id];
  $: name = video?.name ?? "";
  $: mimeType = video?.mimeType ?? "";
  $: width = video?.width ?? 0;
  $: height = video?.height ?? 0;

  async function handleOpen() {
    await callExternal(video.id, video.name, video.mimeType);
  }

  onMount(async () => {
    if (!video) {
      await openVideo(id);
    }
    url = getStreamUrl(id, name);
  });
</script>

<div class="w-full h-full flex flex-col">
  <div class="flex bg-pale-900">
    <div class="flex-1 p-3 whitespace-nowrap overflow-x-auto select-text">
      {name}
    </div>
    <div class="flex">
      <RoundedButton on:click={handleOpen}>
        <Icon name="open_in_new" />
      </RoundedButton>
    </div>
  </div>
  <div class="flex-1 flex flex-col justify-center items-center overflow-y-auto">
    {#if width && height && mimeType && url}
      <video
        autoplay={false}
        controls={true}
        preload="metadata"
        {width}
        {height}
      >
        <source type={mimeType} src={url} />
        <track kind="captions" />
      </video>
    {/if}
  </div>
</div>
