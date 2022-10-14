<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$types/traits";
  import { getFileSystemContext } from "$stores/filesystem";
  import Icon from "$atoms/Icon.svelte";
  import IconButton from "$atoms/IconButton.svelte";
  import QueueButton from "$molecules/QueueButton.svelte";
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
  const dispatch = createEventDispatcher<Events>();

  function getNameById(id: string) {
    return $nodeMap[id].name;
  }
</script>

<div class="flex bg-paper-800">
  <div class="flex-0 flex">
    <IconButton disabled={stack.length <= 1} on:click={() => dispatch("back")}>
      <Icon name="chevron_left" />
    </IconButton>
  </div>
  <div class="flex-1 flex min-w-0">
    <Breadcrumb {stack} on:open={(event) => dispatch("backTo", event.detail)} />
  </div>
  <div class="flex-0 flex">
    <SortButton />
    <QueueButton {getNameById} />
    <SyncButton />
  </div>
</div>
