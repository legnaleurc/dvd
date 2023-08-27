<script lang="ts">
  import type { NeverRecord } from "$types/traits";

  type $$Events = {
    click: MouseEvent;
  };
  type $$Slots = {
    title: NeverRecord;
    caption: NeverRecord;
    action: NeverRecord;
  };

  export let disabled = false;
  export let selected = false;
</script>

<div class="w-full flex" class:bg-pale-800={selected}>
  <button
    type="button"
    class="flex-1 p-3 flex flex-col text-left disabled:opacity-30"
    {disabled}
    on:click
  >
    <div>
      <slot name="title" />
    </div>
    <div class="text-pale-400">
      <slot name="caption" />
    </div>
  </button>
  <div class="flex-0">
    <slot name="action" />
  </div>
</div>
