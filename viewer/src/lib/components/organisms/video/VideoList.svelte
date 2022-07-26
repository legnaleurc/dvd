<script lang="ts">
  import { getVideoContext } from "$lib/stores/video";
  import EmptyBlock from "$lib/components/atoms/EmptyBlock.svelte";
  import IconButton from "$lib/components/atoms/IconButton.svelte";
  import Icon from "$lib/components/atoms/Icon.svelte";

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
    <ul class="flex flex-col-reverse justify-end">
      {#each $idList as id (id)}
        <li class="break-all">
          <a class="block w-full p-3 text-left" href="/video/{id}"
            >{$videoMap[id].name}</a
          >
        </li>
      {:else}
        <li>
          <EmptyBlock />
        </li>
      {/each}
    </ul>
  </div>
</div>
