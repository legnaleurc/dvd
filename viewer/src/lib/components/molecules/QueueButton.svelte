<script lang="ts">
  import { writable } from "svelte/store";

  import { getQueueContext } from "$lib/stores/queue";
  import Icon from "$lib/components/atoms/Icon.svelte";
  import IconBadge from "$lib/components/atoms/IconBadge.svelte";
  import IconButton from "$lib/components/atoms/IconButton.svelte";
  import QueueModal from "./QueueModal.svelte";

  export let getNameById: (id: string) => string;

  const { pendingCount } = getQueueContext();

  const showQueue = writable(false);
</script>

<IconButton on:click={() => showQueue.set(true)}>
  <IconBadge count={$pendingCount} variant="warning">
    <Icon name="pending" />
  </IconBadge>
</IconButton>
<QueueModal
  show={$showQueue}
  {getNameById}
  on:hide={() => showQueue.set(false)}
/>
