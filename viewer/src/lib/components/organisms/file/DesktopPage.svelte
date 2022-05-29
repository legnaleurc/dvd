<script lang="ts">
  import { setDragDropContext } from "$lib/stores/dragdrop";
  import { getFileSystemContext } from "$lib/stores/filesystem";
  import LabeledSwitch from "$lib/components/atoms/LabeledSwitch.svelte";
  import QueueButton from "$lib/components/molecules/QueueButton.svelte";
  import TreeFrame from "./TreeFrame.svelte";
  import SyncButton from "./SyncButton.svelte";

  const { nodeMap } = getFileSystemContext();
  setDragDropContext();

  let twoColumn = false;

  function getNameById(id: string) {
    return $nodeMap[id].name;
  }
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
      <QueueButton {getNameById} />
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
