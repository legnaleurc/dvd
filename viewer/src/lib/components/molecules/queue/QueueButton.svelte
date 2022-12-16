<script lang="ts">
  import { getQueueContext } from "$stores/queue";
  import Icon from "$atoms/Icon.svelte";
  import IconBadge from "$atoms/IconBadge.svelte";
  import IconButton from "$atoms/IconButton.svelte";
  import QueueModal from "./QueueModal.svelte";

  export let getNameById: (id: string) => string;

  const { pendingCount, fullfilledCount, rejectedCount } = getQueueContext();

  let showQueue = false;

  $: hasResult = $fullfilledCount + $rejectedCount > 0;
  $: hasPending = $pendingCount > 0;
  $: icon = hasPending
    ? "hourglass_top"
    : hasResult
    ? "hourglass_bottom"
    : "hourglass_empty";
</script>

<IconButton on:click={() => (showQueue = true)}>
  <IconBadge count={$pendingCount} variant="warning">
    <Icon name={icon} />
  </IconBadge>
</IconButton>
<QueueModal
  show={showQueue}
  {getNameById}
  on:hide={() => (showQueue = false)}
/>
