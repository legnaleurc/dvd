<script lang="ts">
  import { getSearchContext } from "$stores/search";
  import { getSelectionContext } from "$stores/selection";
  import Icon from "$atoms/Icon.svelte";
  import RoundedButton from "$atoms/RoundedButton.svelte";

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
  <RoundedButton disabled={$selectedId.size <= 0} on:click={commitDetails}>
    <Icon name="zoom_in" />
  </RoundedButton>
{:else}
  <RoundedButton on:click={flushDetails}>
    <Icon name="zoom_out" />
  </RoundedButton>
{/if}
