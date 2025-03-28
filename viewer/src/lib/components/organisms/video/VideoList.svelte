<script lang="ts">
  import { getVideoContext } from "$stores/video";
  import EmptyBlock from "$atoms/EmptyBlock.svelte";
  import RoundedButton from "$atoms/RoundedButton.svelte";
  import Icon from "$atoms/Icon.svelte";
  import VideoItem from "./VideoItem.svelte";

  const { idList, clearAllVideo } = getVideoContext();
</script>

<div class="w-full h-full flex flex-col">
  <div class="flex bg-pale-900">
    <div class="flex-1" />
    <div class="flex">
      <RoundedButton on:click={clearAllVideo}>
        <Icon name="playlist_remove" />
      </RoundedButton>
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
