<script lang="ts">
  type $$Events = {
    click: MouseEvent;
  };
  type $$Slots = {
    title: Record<string, never>;
    caption: Record<string, never>;
    action: Record<string, never>;
  };

  export let disabled = false;
  export let selected = false;
</script>

<div class="w-full flex" class:bg-pale-600={selected}>
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
