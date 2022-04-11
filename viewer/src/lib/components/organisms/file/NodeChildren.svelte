<script lang="ts">
  import { getSelectionContext } from "$lib/stores/selection";
  import NodeParent from "./NodeParent.svelte";

  export let idList: string[];

  const { selectedId } = getSelectionContext();

  let beginId: string = "";
  let endId: string = "";

  function selectRange() {
    if (!beginId || !endId) {
      return;
    }
    const begin = idList.indexOf(beginId);
    const end = idList.indexOf(endId);
    if (begin < 0 || end < 0) {
      return;
    }
    selectedId.update((self) => {
      for (let i = begin; i <= end; ++i) {
        self.add(idList[i]);
      }
      return self;
    });
  }

  function handleBegin(event: CustomEvent<string>) {
    beginId = event.detail;
  }

  function handleEnd(event: CustomEvent<string>) {
    endId = event.detail;
    selectRange();
    beginId = "";
    endId = "";
  }
</script>

<ul class="w-full h-full flex flex-col">
  {#each idList as id (id)}
    <li>
      <NodeParent {id} on:begin={handleBegin} on:end={handleEnd} />
    </li>
  {/each}
</ul>
