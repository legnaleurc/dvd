<script lang="ts">
  import { goto } from "$app/navigation";

  import { getVideoContext } from "$stores/video";
  import { callExternal } from "$tools/external";
  import IconButton from "$atoms/IconButton.svelte";
  import Icon from "$atoms/Icon.svelte";

  export let id: string;

  const { videoMap } = getVideoContext();

  $: video = $videoMap[id];

  async function handlePush() {
    await goto(`/video/${id}`);
  }

  async function handleOpen() {
    await callExternal(video.id, video.name, video.mimeType);
  }
</script>

<div class="w-full p-3 flex">
  <div class="flex-1 flex flex-col break-all">
    <div>{video.name}</div>
    <div class="text-symbol-hint">{video.path}</div>
  </div>
  <div class="flex-0 flex">
    <IconButton on:click={handleOpen}>
      <Icon name="open_in_new" />
    </IconButton>
    <IconButton on:click={handlePush}>
      <Icon name="chevron_right" />
    </IconButton>
  </div>
</div>
