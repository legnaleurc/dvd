<script lang="ts">
  import { getFileSystemContext } from "$stores/filesystem";
  import Icon from "$atoms/Icon.svelte";
  import IconButton from "$atoms/IconButton.svelte";

  const { isSyncing, sync } = getFileSystemContext();
</script>

<IconButton disabled={$isSyncing} on:click={sync}>
  <Icon name="update" />
</IconButton>
