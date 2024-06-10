<script lang="ts">
  import { getQueueContext } from "$stores/queue";
  import Icon from "$atoms/Icon.svelte";
  import IconBadge from "$atoms/IconBadge.svelte";
  import RoundedButton from "$atoms/RoundedButton.svelte";
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

<RoundedButton on:click={() => (showQueue = true)}>
  <IconBadge count={$pendingCount} variant="warning">
    <Icon name={icon} />
  </IconBadge>
</RoundedButton>
<QueueModal
  show={showQueue}
  {getNameById}
  on:hide={() => (showQueue = false)}
/>
