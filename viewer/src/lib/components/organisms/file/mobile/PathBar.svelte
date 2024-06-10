<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$types/traits";
  import { getFileSystemContext } from "$stores/filesystem";
  import Icon from "$atoms/Icon.svelte";
  import RoundedButton from "$atoms/RoundedButton.svelte";
  import QueueButton from "$molecules/queue";
  import SyncButton from "$organisms/file/common/SyncButton.svelte";
  import SortButton from "$organisms/file/common/SortButton.svelte";
  import Breadcrumb from "./Breadcrumb.svelte";

  type $$Events = SvelteCustomEvents<{
    back: null;
    backTo: number;
  }>;

  export let stack: string[];

  const { nodeMap } = getFileSystemContext();
  const dispatch = createEventDispatcher();

  function getNameById(id: string) {
    return $nodeMap[id].name;
  }
</script>

<div class="flex bg-pale-900">
  <div class="flex-0 flex">
    <RoundedButton
      disabled={stack.length <= 1}
      on:click={() => dispatch("back")}
    >
      <Icon name="chevron_left" />
    </RoundedButton>
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
