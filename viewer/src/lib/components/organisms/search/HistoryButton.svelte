<script lang="ts">
  import Icon from "$atoms/Icon.svelte";
  import IconButton from "$atoms/IconButton.svelte";
  import HistoryModal from "./HistoryModal.svelte";

  export let disabled: boolean;

  let showHistory = false;
</script>

<IconButton {disabled} on:click={() => (showHistory = true)}>
  <Icon name="history" />
</IconButton>
<HistoryModal show={showHistory} on:hide={() => (showHistory = false)} />
