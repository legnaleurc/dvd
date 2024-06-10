<script lang="ts">
  import Icon from "$atoms/Icon.svelte";
  import RoundedButton from "$atoms/RoundedButton.svelte";
  import HistoryModal from "./HistoryModal.svelte";

  export let disabled: boolean;

  let showHistory = false;
</script>

<RoundedButton {disabled} on:click={() => (showHistory = true)}>
  <Icon name="history" />
</RoundedButton>
<HistoryModal show={showHistory} on:hide={() => (showHistory = false)} />
