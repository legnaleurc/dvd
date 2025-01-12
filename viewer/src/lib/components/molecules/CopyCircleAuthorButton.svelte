<script lang="ts">
  import { extractCircleAndAuthor } from "$lib/tools/string";
  import Icon from "$atoms/Icon.svelte";
  import RoundedButton from "$atoms/RoundedButton.svelte";

  export let name: string;

  async function handleCopy() {
    const rv = extractCircleAndAuthor(name);
    await window.navigator.clipboard.writeText(rv);
  }
</script>

<RoundedButton on:click={handleCopy}>
  <Icon name="content_copy" />
</RoundedButton>
