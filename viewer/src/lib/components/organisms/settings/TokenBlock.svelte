<script lang="ts">
  import { saveToken } from "$tools/storage";
  import Icon from "$atoms/Icon.svelte";
  import IconButton from "$atoms/IconButton.svelte";
  import VoidForm from "$atoms/VoidForm.svelte";
  import InputGroup from "./InputGroup.svelte";
  import SettingsGroup from "./SettingsGroup.svelte";

  let token: string;

  function handleSave() {
    saveToken(token);
    token = "";
  }

  function handleReload() {
    window.location.reload();
  }
</script>

<SettingsGroup>
  <span slot="header">Access Token</span>
  <InputGroup slot="body">
    <svelte:fragment slot="input">
      <VoidForm>
        <input
          class="m-3 px-3 flex-1 bg-black"
          type="password"
          placeholder="Token"
          autocomplete="new-password"
          bind:value={token}
        />
      </VoidForm>
    </svelte:fragment>
    <svelte:fragment slot="action">
      <IconButton on:click={handleSave}>
        <Icon name="save" />
      </IconButton>
      <IconButton on:click={handleReload}>
        <Icon name="restore_page" />
      </IconButton>
    </svelte:fragment>
  </InputGroup>
</SettingsGroup>
