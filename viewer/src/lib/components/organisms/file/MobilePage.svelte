<script lang="ts">
  import { beforeNavigate } from "$app/navigation";
  import { getSelectionContext, setSelectionContext } from "$stores/selection";
  import { getFileSystemContext } from "$stores/filesystem";
  import { getFullScreenContext } from "$stores/fullscreen";
  import { setSortContext } from "$stores/sort";
  import MobileToolBar from "./MobileToolBar.svelte";
  import NodeList from "./NodeList.svelte";
  import PathBar from "./PathBar.svelte";
  import SortedList from "./SortedList.svelte";

  setSelectionContext();
  setSortContext();

  const { rootId } = getFileSystemContext();
  const { deselectAll, selectedId } = getSelectionContext();
  const { isFullScreen } = getFullScreenContext();

  let stack: string[] = [];
  let isSelectionEmpty = true;

  function handlePush(node: CustomEvent<string>) {
    deselectAll();
    stack = [...stack, node.detail];
  }

  function handlePop() {
    deselectAll();
    stack = [...stack.slice(0, stack.length - 1)];
  }

  function handlePopTo(event: CustomEvent<number>) {
    const index = event.detail;
    if (index < 0) {
      return;
    }
    deselectAll();
    stack = [...stack.slice(0, index + 1)];
  }

  beforeNavigate(() => {
    deselectAll();
  });

  $: {
    if ($rootId) {
      stack = [$rootId];
    }
  }
  $: {
    isSelectionEmpty = $selectedId.size <= 0;
    isFullScreen.set(!isSelectionEmpty);
  }
</script>

<div class="w-full h-full flex flex-col">
  <PathBar {stack} on:back={handlePop} on:backTo={handlePopTo} />
  <div class="flex-1 min-h-0">
    {#each stack as id (id)}
      <div class="hidden last:flex w-full h-full">
        <SortedList {id} autoLoad={true} let:loaded let:idList>
          <NodeList {loaded} {idList} on:open={handlePush} />
        </SortedList>
      </div>
    {/each}
  </div>
  {#if !isSelectionEmpty}
    <MobileToolBar />
  {/if}
</div>
