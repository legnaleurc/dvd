<script lang="ts">
  import { getDisabledContext } from "$lib/stores/disabled";
  import { getSelectionContext } from "$lib/stores/selection";
  import NodeParent from "./NodeParent.svelte";

  export let idList: string[];

  const { disabledId } = getDisabledContext();
  const { selectedId } = getSelectionContext();

  let beginId = "";
  let endId = "";

  function selectRange() {
    if (!beginId || !endId) {
      return;
    }
    let begin = idList.indexOf(beginId);
    let end = idList.indexOf(endId);
    if (begin < 0 || end < 0) {
      return;
    }
    if (begin > end) {
      [begin, end] = [end, begin];
    }
    const disabled = $disabledId;
    selectedId.update((self) => {
      for (let i = begin; i <= end; ++i) {
        const id = idList[i];
        if (disabled.has(id)) {
          continue;
        }
        self.add(id);
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
