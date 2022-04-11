<script lang="ts">
  import Icon from "$lib/components/atoms/Icon.svelte";
  import IconButton from "$lib/components/atoms/IconButton.svelte";
  import SortMenu from "./SortMenu.svelte";
</script>

<SortMenu let:show>
  <IconButton on:click={(event) => show(event.clientX, event.clientY)}>
    <Icon name="sort" />
  </IconButton>
</SortMenu>
