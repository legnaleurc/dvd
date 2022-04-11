<script lang="ts">
  import LabeledSwitch from "$lib/components/atoms/LabeledSwitch.svelte";
  import TreeFrame from "./TreeFrame.svelte";
  import SyncButton from "./SyncButton.svelte";
  import QueueButton from "./QueueButton.svelte";

  let twoColumn: boolean = false;
</script>

<div class="w-full h-full flex flex-col">
  <div class="flex-0 flex bg-paper-800">
    <div class="flex-0">
      <LabeledSwitch
        id="switch-two-column-mode"
        label="Two Column Mode"
        bind:checked={twoColumn}
      />
    </div>
    <div class="flex-1" />
    <div class="flex-0 flex">
      <QueueButton />
      <SyncButton />
    </div>
  </div>
  <div class="flex-1 flex min-h-0">
    <div class="flex-1">
      <TreeFrame placement="left" />
    </div>
    <div class="flex-1" class:hidden={!twoColumn}>
      <TreeFrame placement="right" />
    </div>
  </div>
</div>
