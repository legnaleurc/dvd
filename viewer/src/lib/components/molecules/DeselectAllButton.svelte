<script lang="ts">
  import IconButton from "$lib/components/atoms/IconButton.svelte";
  import IconBadge from "$lib/components/atoms/IconBadge.svelte";
  import Icon from "$lib/components/atoms/Icon.svelte";

  export let selectedId: Set<string>;
  export let deselectAll: () => void;

  $: isSelectionEmpty = selectedId.size <= 0;
</script>

<IconButton disabled={isSelectionEmpty} on:click={deselectAll}>
  <IconBadge count={selectedId.size} variant="primary">
    <Icon name="deselect" />
  </IconBadge>
</IconButton>
