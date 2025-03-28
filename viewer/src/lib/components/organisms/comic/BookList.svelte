<script lang="ts">
  import { goto } from "$app/navigation";
  import { getComicContext } from "$stores/comic";
  import Icon from "$atoms/Icon.svelte";
  import RoundedButton from "$atoms/RoundedButton.svelte";
  import EmptyBlock from "$atoms/EmptyBlock.svelte";
  import ListItem from "$molecules/ListItem.svelte";

  const { idList, comicMap, clearComic, openCachedComic } = getComicContext();

  function handleOpen(id: string) {
    goto(`/comic/${id}`);
  }
</script>

<div class="w-full h-full flex flex-col">
  <div class="flex bg-pale-900">
    <div class="flex-1" />
    <div>
      <RoundedButton on:click={clearComic}>
        <Icon name="playlist_remove" />
      </RoundedButton>
      <RoundedButton on:click={openCachedComic}>
        <Icon name="restore" />
      </RoundedButton>
    </div>
  </div>
  <div class="flex-1 overflow-y-auto">
    <div class="flex flex-col-reverse justify-end">
      {#each $idList as id (id)}
        {@const comic = $comicMap[id]}
        {@const noContent = comic.imageList.length <= 0}
        <ListItem
          disabled={comic.unpacking || noContent}
          on:click={() => handleOpen(id)}
        >
          <span
            slot="title"
            class="break-all"
            class:line-through={!comic.unpacking && noContent}
            >{comic.name}</span
          >
        </ListItem>
      {:else}
        <EmptyBlock />
      {/each}
    </div>
  </div>
</div>
