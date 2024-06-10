<script lang="ts">
  import { getFileSystemContext } from "$stores/filesystem";
  import Icon from "$atoms/Icon.svelte";
  import RoundedButton from "$atoms/RoundedButton.svelte";

  const { isSyncing, sync } = getFileSystemContext();
</script>

<RoundedButton disabled={$isSyncing} on:click={sync}>
  <Icon name="update" />
</RoundedButton>
