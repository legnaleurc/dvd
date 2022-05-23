<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$lib/types/traits";
  import { getFileSystemContext } from "$lib/stores/filesystem";
  import { getQueueContext } from "$lib/stores/queue";
  import Icon from "$lib/components/atoms/Icon.svelte";
  import IconButton from "$lib/components/atoms/IconButton.svelte";
  import QueueButton from "$lib/components/molecules/QueueButton.svelte";
  import Breadcrumb from "./Breadcrumb.svelte";
  import SyncButton from "./SyncButton.svelte";
  import SortButton from "./SortButton.svelte";

  type Events = {
    back: void;
    backTo: number;
  };
  type $$Events = SvelteCustomEvents<Events>;

  export let stack: string[];

  const { nodeMap } = getFileSystemContext();
  const { pendingList, pendingCount, resolvedCount, rejectedCount } =
    getQueueContext();
  const dispatch = createEventDispatcher<Events>();

  function getNameById(id: string) {
    return $nodeMap[id].name;
  }
</script>

<div class="flex bg-paper-800">
  <div class="flex-0">
    <IconButton disabled={stack.length <= 1} on:click={() => dispatch("back")}>
      <Icon name="chevron_left" />
    </IconButton>
  </div>
  <div class="flex-1 flex min-w-0">
    <Breadcrumb {stack} on:open={(event) => dispatch("backTo", event.detail)} />
  </div>
  <div class="flex-0">
    <SortButton />
    <QueueButton
      {getNameById}
      pendingList={$pendingList}
      pendingCount={$pendingCount}
      resolvedCount={$resolvedCount}
      rejectedCount={$rejectedCount}
    />
    <SyncButton />
  </div>
</div>
