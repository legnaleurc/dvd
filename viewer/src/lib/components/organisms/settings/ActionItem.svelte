<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$types/traits";
  import Icon from "$atoms/Icon.svelte";
  import IconButton from "$atoms/IconButton.svelte";
  import TextInput from "$atoms/TextInput.svelte";
  import InputGroup from "./InputGroup.svelte";

  type $$Events = SvelteCustomEvents<{
    save: {
      type: string;
      command: string;
    };
    remove: string;
  }>;

  export let type: string;
  export let command: string;

  const dispatch = createEventDispatcher();

  let newCommand = "";

  function restoreDefault() {
    newCommand = command;
  }

  $: {
    newCommand = command;
  }
</script>

<div class="flex flex-col">
  <TextInput bind:value={newCommand} />
  <div class="flex-1">
    <InputGroup>
      <div slot="input" class="p-3 flex-0">{type}</div>
      <svelte:fragment slot="action">
        <IconButton
          disabled={newCommand.length <= 0}
          on:click={() => dispatch("save", { type, command: newCommand })}
        >
          <Icon name="save" />
        </IconButton>
        <IconButton variant="danger" on:click={() => dispatch("remove", type)}>
          <Icon name="delete" />
        </IconButton>
        <IconButton on:click={restoreDefault}>
          <Icon name="settings_backup_restore" />
        </IconButton>
      </svelte:fragment>
    </InputGroup>
  </div>
</div>
