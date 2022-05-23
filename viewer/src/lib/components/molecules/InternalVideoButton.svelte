<script lang="ts">
  import IconButton from "$lib/components/atoms/IconButton.svelte";
  import Icon from "$lib/components/atoms/Icon.svelte";

  export let selectedId: Set<string>;
  export let deselectAll: () => void;
  export let openVideo: (id: string) => void;

  $: isSelectionEmpty = selectedId.size <= 0;

  function handleInternal() {
    for (const id of selectedId.values()) {
      openVideo(id);
    }
    deselectAll();
  }
</script>

<IconButton disabled={isSelectionEmpty} on:click={handleInternal}>
  <Icon name="ondemand_video" />
</IconButton>
