<script lang="ts">
  import { getShortcutContext } from "$stores/shortcut";
  import Icon from "$atoms/Icon.svelte";
  import IconButton from "$atoms/IconButton.svelte";
  import TextInput from "$atoms/TextInput.svelte";
  import InputGroup from "./InputGroup.svelte";
  import ShortcutItem from "./ShortcutItem.svelte";
  import SettingsGroup from "./SettingsGroup.svelte";

  const { shortcutList, addShortcut } = getShortcutContext();

  let newShortcut = "";

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
        on:enterpress={handleNew}
      />
      <svelte:fragment slot="action">
        <IconButton disabled={newShortcut.length <= 0} on:click={handleNew}>
          <Icon name="add" />
        </IconButton>
      </svelte:fragment>
    </InputGroup>
  </div>
</SettingsGroup>
