<script lang="ts">
  import { getSelectionContext } from "$lib/stores/selection";
  import { getVideoContext } from "$lib/stores/video";
  import IconButton from "$lib/components/atoms/IconButton.svelte";
  import Icon from "$lib/components/atoms/Icon.svelte";

  const { selectedId, deselectAll } = getSelectionContext();
  const { openVideo } = getVideoContext();

  $: isSelectionEmpty = $selectedId.size <= 0;

  function handleInternal() {
    for (const id of $selectedId.values()) {
      openVideo(id);
    }
    deselectAll();
  }
</script>

<IconButton disabled={isSelectionEmpty} on:click={handleInternal}>
  <Icon name="ondemand_video" />
</IconButton>
