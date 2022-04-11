<script lang="ts">
  import { getSelectionContext } from "$lib/stores/selection";
  import IconButton from "$lib/components/atoms/IconButton.svelte";
  import IconBadge from "$lib/components/atoms/IconBadge.svelte";
  import Icon from "$lib/components/atoms/Icon.svelte";

  const { selectedId, deselectAll } = getSelectionContext();

  $: isSelectionEmpty = $selectedId.size <= 0;
</script>

<IconButton disabled={isSelectionEmpty} on:click={deselectAll}>
  <IconBadge count={$selectedId.size}>
    <Icon name="deselect" />
  </IconBadge>
</IconButton>
