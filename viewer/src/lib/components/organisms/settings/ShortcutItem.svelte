<script lang="ts">
  import { getShortcutContext } from "$stores/shortcut";
  import Icon from "$atoms/Icon.svelte";
  import RoundedButton from "$atoms/RoundedButton.svelte";
  import TextInput from "$atoms/TextInput.svelte";
  import InputGroup from "./InputGroup.svelte";

  export let index: number;
  export let shortcut: string;

  const { updateShortcut, removeShortcut } = getShortcutContext();

  let newShortcut: string;

  function handleSave() {
    if (!newShortcut) {
      return;
    }
    updateShortcut(index, newShortcut);
  }

  function handleRemove() {
    removeShortcut(index);
  }

  function restoreDefault() {
    newShortcut = shortcut;
  }

  $: {
    newShortcut = shortcut;
  }
</script>

<InputGroup>
  <TextInput slot="input" class="flex-1" bind:value={newShortcut} />
  <svelte:fragment slot="action">
    <RoundedButton disabled={newShortcut.length <= 0} on:click={handleSave}>
      <Icon name="save" />
    </RoundedButton>
    <RoundedButton variant="danger" on:click={handleRemove}>
      <Icon name="delete" />
    </RoundedButton>
    <RoundedButton on:click={restoreDefault}>
      <Icon name="settings_backup_restore" />
    </RoundedButton>
  </svelte:fragment>
</InputGroup>
