<script lang="ts">
  import { getSearchContext } from "$lib/stores/search";
  import { getSelectionContext } from "$lib/stores/selection";
  import Icon from "$lib/components/atoms/Icon.svelte";
  import IconButton from "$lib/components/atoms/IconButton.svelte";

  const { detailList } = getSearchContext();
  const { selectedId, deselectList, deselectAll } = getSelectionContext();

  function commitDetails() {
    const idList = Array.from($selectedId);
    detailList.set(idList);
    deselectList(idList);
  }

  function flushDetails() {
    detailList.set([]);
    deselectAll();
  }

  $: hasDetails = $detailList.length > 0;
</script>

{#if !hasDetails}
  <IconButton disabled={$selectedId.size <= 0} on:click={commitDetails}>
    <Icon name="zoom_in" />
  </IconButton>
{:else}
  <IconButton on:click={flushDetails}>
    <Icon name="zoom_out" />
  </IconButton>
{/if}
