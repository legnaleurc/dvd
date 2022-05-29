<script lang="ts">
  import { getVideoContext } from "$lib/stores/video";
  import { getSelectionContext } from "$lib/stores/selection";
  import IconButton from "$lib/components/atoms/IconButton.svelte";
  import Icon from "$lib/components/atoms/Icon.svelte";

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
