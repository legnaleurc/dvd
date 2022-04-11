<script lang="ts">
  import { onMount } from "svelte";

  import { loadToken, saveToken } from "$lib/tools/storage";
  import Icon from "$lib/components/atoms/Icon.svelte";
  import IconButton from "$lib/components/atoms/IconButton.svelte";
  import InputGroup from "./InputGroup.svelte";
  import SettingsGroup from "./SettingsGroup.svelte";

  let token: string;

  function handleSave() {
    saveToken(token);
  }

  function handleReload() {
    window.location.reload();
  }

  onMount(() => {
    token = loadToken();
  });
</script>

<SettingsGroup>
  <span slot="header">Access Token</span>
  <InputGroup slot="body">
    <svelte:fragment slot="input">
      <input
        class="m-3 px-3 flex-1 bg-black"
        type="password"
        placeholder="Token"
        autocomplete="off"
        bind:value={token}
      />
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
