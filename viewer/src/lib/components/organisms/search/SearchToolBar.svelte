<script lang="ts">
  import type { SearchResponse } from "$lib/types/api";
  import ToolBar from "$lib/components/organisms/widget/ToolBar.svelte";

  export let resultMap: Record<string, SearchResponse>;

  function getNameById(id: string) {
    return resultMap[id].name;
  }

  function getMimeTypeById(id: string) {
    return resultMap[id].mime_type;
  }
</script>

<ToolBar {getNameById} {getMimeTypeById} />
