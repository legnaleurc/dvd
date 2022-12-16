<script lang="ts">
  import { getVideoContext } from "$stores/video";
  import EmptyBlock from "$atoms/EmptyBlock.svelte";
  import IconButton from "$atoms/IconButton.svelte";
  import Icon from "$atoms/Icon.svelte";
  import VideoItem from "./VideoItem.svelte";

  const { idList, videoMap, clearAllVideo } = getVideoContext();
</script>

<div class="w-full h-full flex flex-col">
  <div class="flex-0 flex bg-paper-800">
    <div class="flex-1" />
    <div class="flex-0 flex">
      <IconButton on:click={clearAllVideo}>
        <Icon name="playlist_remove" />
      </IconButton>
    </div>
  </div>
  <div class="flex-1 overflow-y-auto">
    <div class="flex flex-col-reverse justify-end">
      {#each $idList as id (id)}
        <VideoItem {id} />
      {:else}
        <EmptyBlock />
      {/each}
    </div>
  </div>
</div>
