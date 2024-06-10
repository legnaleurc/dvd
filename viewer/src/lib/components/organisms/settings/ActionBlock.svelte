<script lang="ts">
  import { onMount } from "svelte";

  import { loadActionMap, saveActionMap } from "$tools/storage";
  import Icon from "$atoms/Icon.svelte";
  import RoundedButton from "$atoms/RoundedButton.svelte";
  import TextInput from "$atoms/TextInput.svelte";
  import InputGroup from "./InputGroup.svelte";
  import SettingsGroup from "./SettingsGroup.svelte";
  import ActionItem from "./ActionItem.svelte";
  import QuickCommandMenu from "./QuickCommandMenu.svelte";

  let actionMap: Record<string, string> = {};
  let newType = "";
  let newCommand = "";

  function handleAdd() {
    if (!newType || !newCommand) {
      return;
    }
    if (actionMap[newType]) {
      return;
    }
    actionMap[newType] = newCommand;
    saveActionMap(actionMap);
    actionMap = actionMap;
    newType = "";
    newCommand = "";
  }

  function handleSave(event: CustomEvent<{ type: string; command: string }>) {
    const { type, command } = event.detail;
    if (!type || !command) {
      return;
    }
    if (!actionMap[type]) {
      return;
    }
    actionMap[type] = command;
    saveActionMap(actionMap);
    actionMap = actionMap;
  }

  function handleRemove(event: CustomEvent<string>) {
    const type = event.detail;
    if (!type) {
      return;
    }
    delete actionMap[type];
    saveActionMap(actionMap);
    actionMap = actionMap;
  }

  function handleQuickCommand(event: CustomEvent<string>) {
    const command = event.detail;
    newCommand = command;
  }

  onMount(() => {
    actionMap = loadActionMap();
  });

  $: hasSameType = actionMap[newType] !== undefined;
</script>

<SettingsGroup>
  <span slot="header">Actions</span>
  <div slot="body" class="flex flex-col">
    <div class="flex flex-col">
      {#each Object.entries(actionMap) as [type, command] (type)}
        <ActionItem
          {type}
          {command}
          on:save={handleSave}
          on:remove={handleRemove}
        />
      {/each}
    </div>
    <div class="flex flex-col">
      <InputGroup>
        <TextInput
          slot="input"
          class="flex-1"
          placeholder="Command"
          bind:value={newCommand}
        />
        <svelte:fragment slot="action">
          <QuickCommandMenu let:showMenu on:command={handleQuickCommand}>
            <RoundedButton on:click={(e) => showMenu(e.clientX, e.clientY)}>
              <Icon name="input" />
            </RoundedButton>
          </QuickCommandMenu>
        </svelte:fragment>
      </InputGroup>
      <InputGroup>
        <TextInput
          slot="input"
          class="flex-1"
          placeholder="Type"
          bind:value={newType}
        />
        <svelte:fragment slot="action">
          <RoundedButton
            disabled={!newType || !newCommand || hasSameType}
            on:click={handleAdd}
          >
            <Icon name="add" />
          </RoundedButton>
        </svelte:fragment>
      </InputGroup>
    </div>
  </div>
</SettingsGroup>
