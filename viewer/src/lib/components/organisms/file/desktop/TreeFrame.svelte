<script lang="ts">
  import { getFileSystemContext } from "$stores/filesystem";
  import { setSelectionContext } from "$stores/selection";
  import { setSortContext } from "$stores/sort";
  import SortedList from "$organisms/file/common/SortedList.svelte";
  import DesktopToolBar from "./DesktopToolBar.svelte";
  import NodeChildren from "./NodeChildren.svelte";

  setSortContext();
  setSelectionContext();

  export let placement: "left" | "right";

  const { rootId } = getFileSystemContext();
</script>

<div class="w-full h-full flex">
  {#if placement === "left"}
    <div>
      <DesktopToolBar />
    </div>
  {/if}
  <div class="flex flex-col flex-1 overflow-y-auto">
    <SortedList id={$rootId} autoLoad={false} let:idList>
      <NodeChildren {idList} />
    </SortedList>
  </div>
  {#if placement === "right"}
    <div>
      <DesktopToolBar />
    </div>
  {/if}
</div>
