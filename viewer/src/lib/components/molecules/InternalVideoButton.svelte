<script lang="ts">
  import { getVideoContext } from "$stores/video";
  import { getSelectionContext } from "$stores/selection";
  import IconButton from "$atoms/IconButton.svelte";
  import Icon from "$atoms/Icon.svelte";

  const { openVideo } = getVideoContext();
  const { selectedId, deselectList } = getSelectionContext();

  $: isSelectionEmpty = $selectedId.size <= 0;

  function handleInternal() {
    const idList = Array.from($selectedId);
    for (const id of idList) {
      openVideo(id);
    }
    deselectList(idList);
  }
</script>

<IconButton disabled={isSelectionEmpty} on:click={handleInternal}>
  <Icon name="ondemand_video" />
</IconButton>
