<script lang="ts">
  import { getShortcutContext } from "$lib/stores/shortcut";
  import Icon from "$lib/components/atoms/Icon.svelte";
  import IconButton from "$lib/components/atoms/IconButton.svelte";
  import TextInput from "$lib/components/atoms/TextInput.svelte";
  import InputGroup from "./InputGroup.svelte";
  import ShortcutItem from "./ShortcutItem.svelte";
  import SettingsGroup from "./SettingsGroup.svelte";

  const { shortcutList, addShortcut } = getShortcutContext();

  let newShortcut: string = "";

  function handleNew() {
    if (!newShortcut) {
      return;
    }
    addShortcut(newShortcut);
    newShortcut = "";
  }
</script>

<SettingsGroup>
  <span slot="header">Shortcut</span>
  <div slot="body" class="flex flex-col">
    {#each $shortcutList as shortcut, index (index)}
      <ShortcutItem {shortcut} {index} />
    {/each}
    <InputGroup>
      <TextInput
        slot="input"
        class="flex-1"
        placeholder="New Shortcut"
        bind:value={newShortcut}
        on:enterpressed={handleNew}
      />
      <svelte:fragment slot="action">
        <IconButton disabled={newShortcut.length <= 0} on:click={handleNew}>
          <Icon name="add" />
        </IconButton>
      </svelte:fragment>
    </InputGroup>
  </div>
</SettingsGroup>
