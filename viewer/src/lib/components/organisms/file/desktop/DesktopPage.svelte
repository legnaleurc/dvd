<script lang="ts">
  import { setDragDropContext } from "$stores/dragdrop";
  import { getFileSystemContext } from "$stores/filesystem";
  import LabeledSwitch from "$atoms/LabeledSwitch.svelte";
  import QueueButton from "$molecules/queue";
  import SyncButton from "$organisms/file/common/SyncButton.svelte";
  import TreeFrame from "./TreeFrame.svelte";

  const { nodeMap } = getFileSystemContext();
  setDragDropContext();

  let twoColumn = false;

  function getNameById(id: string) {
    return $nodeMap[id].name;
  }
</script>

<div class="w-full h-full flex flex-col">
  <div class="flex bg-pale-900">
    <div>
      <LabeledSwitch
        id="switch-two-column-mode"
        label="Two Column Mode"
        bind:checked={twoColumn}
      />
    </div>
    <div class="flex-1"></div>
    <div class="flex">
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
