<script lang="ts">
  import { getSearchContext } from "$lib/stores/search";
  import ToolBar from "$lib/components/organisms/widget/ToolBar.svelte";

  const { resultMap } = getSearchContext();

  function getNameById(id: string) {
    return $resultMap[id].name;
  }

  function getMimeTypeById(id: string) {
    return $resultMap[id].mime_type;
  }
</script>

<ToolBar {getNameById} {getMimeTypeById} />
