<script lang="ts">
  import { getSearchContext } from "$stores/search";
  import QueueButton from "$molecules/queue";
  import SearchBox from "./SearchBox.svelte";
  import HistoryButton from "./HistoryButton.svelte";
  import DetailButton from "./DetailButton.svelte";

  const { resultMap, detailList } = getSearchContext();

  function getNameById(id: string) {
    return $resultMap[id]?.name ?? "";
  }

  $: hasDetails = $detailList.length > 0;
</script>

<div class="flex flex-col bg-pale-900">
  <div class="flex">
    <SearchBox class="flex-1" disabled={hasDetails} />
    <div class="flex">
      <DetailButton />
      <QueueButton {getNameById} />
      <HistoryButton disabled={hasDetails} />
    </div>
  </div>
</div>
