<script lang="ts">
  import { getSelectionContext } from "$stores/selection";
  import RoundedButton from "$atoms/RoundedButton.svelte";
  import IconBadge from "$atoms/IconBadge.svelte";
  import Icon from "$atoms/Icon.svelte";

  const { selectedId, deselectAll } = getSelectionContext();

  $: isSelectionEmpty = $selectedId.size <= 0;
</script>

<RoundedButton disabled={isSelectionEmpty} on:click={deselectAll}>
  <IconBadge count={$selectedId.size} variant="primary">
    <Icon name="deselect" />
  </IconBadge>
</RoundedButton>
