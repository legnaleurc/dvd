<script lang="ts">
  import { goto } from "$app/navigation";

  import { getVideoContext } from "$stores/video";
  import { callExternal } from "$tools/external";
  import IconButton from "$atoms/IconButton.svelte";
  import Icon from "$atoms/Icon.svelte";
  import ListItem from "$molecules/ListItem.svelte";

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

<ListItem>
  <span slot="title">{video.name}</span>
  <span slot="caption">{video.path}</span>
  <div slot="action" class="flex flex-col">
    <IconButton on:click={handlePush}>
      <Icon name="chevron_right" />
    </IconButton>
    <IconButton on:click={handleOpen}>
      <Icon name="open_in_new" />
    </IconButton>
  </div>
</ListItem>
