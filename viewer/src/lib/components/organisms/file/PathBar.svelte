<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SvelteCustomEvents } from "$lib/types/traits";
  import Icon from "$lib/components/atoms/Icon.svelte";
  import IconButton from "$lib/components/atoms/IconButton.svelte";
  import QueueButton from "$lib/components/organisms/widget/QueueButton.svelte";
  import Breadcrumb from "./Breadcrumb.svelte";
  import SyncButton from "./SyncButton.svelte";
  import SortButton from "./SortButton.svelte";

  type Events = {
    back: void;
    backTo: number;
  };
  type $$Events = SvelteCustomEvents<Events>;

  export let stack: string[];

  const dispatch = createEventDispatcher<Events>();
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
    <QueueButton />
    <SyncButton />
  </div>
</div>
