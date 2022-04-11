<script lang="ts">
  import { getFileSystemContext } from "$lib/stores/filesystem";
  import Icon from "$lib/components/atoms/Icon.svelte";
  import IconButton from "$lib/components/atoms/IconButton.svelte";

  const { isSyncing, sync } = getFileSystemContext();
</script>

<IconButton disabled={$isSyncing} on:click={sync}>
  <Icon name="update" />
</IconButton>
