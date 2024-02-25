<script lang="ts">
  import { goto } from "$app/navigation";

  import { getVideoContext } from "$stores/video";
  import ListItem from "$molecules/ListItem.svelte";

  export let id: string;

  const { videoMap } = getVideoContext();

  $: video = $videoMap[id];

  async function handlePush() {
    await goto(`/video/${id}`);
  }
</script>

<ListItem on:click={handlePush}>
  <span slot="title">{video.name}</span>
  <span slot="caption">{video.path}</span>
</ListItem>
