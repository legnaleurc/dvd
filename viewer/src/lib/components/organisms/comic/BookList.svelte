<script lang="ts">
  import { goto } from "$app/navigation";
  import { getComicContext } from "$stores/comic";
  import Icon from "$atoms/Icon.svelte";
  import IconButton from "$atoms/IconButton.svelte";
  import EmptyBlock from "$atoms/EmptyBlock.svelte";

  const { idList, comicMap, clearComic, openCachedComic } = getComicContext();

  function handleOpen(id: string) {
    goto(`/comic/${id}`);
  }
</script>

<div class="w-full h-full flex flex-col">
  <div class="flex-0 flex bg-paper-800">
    <div class="flex-1" />
    <div class="flex-0">
      <IconButton on:click={clearComic}>
        <Icon name="playlist_remove" />
      </IconButton>
      <IconButton on:click={openCachedComic}>
        <Icon name="restore" />
      </IconButton>
    </div>
  </div>
  <div class="flex-1 overflow-y-auto">
    <ul class="flex flex-col-reverse justify-end">
      {#each $idList as id (id)}
        <li class="break-all">
          <button
            class="w-full p-3 text-left disabled:text-action-disabled"
            class:line-through={!$comicMap[id].unpacking &&
              $comicMap[id].imageList.length <= 0}
            disabled={$comicMap[id].unpacking ||
              $comicMap[id].imageList.length <= 0}
            on:click={() => handleOpen(id)}
          >
            {$comicMap[id].name}
          </button>
        </li>
      {:else}
        <li>
          <EmptyBlock />
        </li>
      {/each}
    </ul>
  </div>
</div>
