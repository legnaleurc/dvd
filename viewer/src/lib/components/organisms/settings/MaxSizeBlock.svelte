<script lang="ts">
  import { getComicContext } from "$stores/comic";
  import VoidForm from "$atoms/VoidForm.svelte";
  import InputGroup from "./InputGroup.svelte";
  import SettingsGroup from "./SettingsGroup.svelte";

  const { maxSize, updateMaxSize } = getComicContext();

  let inputValue = $maxSize;

  function handleInput() {
    const value = parseInt(inputValue.toString(), 10);
    if (!isNaN(value) && value >= 0) {
      updateMaxSize(value);
    }
  }
</script>

<SettingsGroup>
  <span slot="header">Max Size</span>
  <div slot="body" class="flex flex-col">
    <InputGroup>
      <svelte:fragment slot="input">
        <VoidForm>
          <input
            class="m-3 px-3 flex-1 bg-black"
            type="number"
            inputmode="numeric"
            pattern="[0-9]*"
            placeholder="Max Size (0 = no limit)"
            bind:value={inputValue}
            on:input={handleInput}
            min="0"
            step="256"
          />
        </VoidForm>
      </svelte:fragment>
    </InputGroup>
  </div>
</SettingsGroup>
