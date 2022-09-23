<script lang="ts">
  import ActionBlock from "./ActionBlock.svelte";
  import ShortcutBlock from "./ShortcutBlock.svelte";
  import TokenBlock from "./TokenBlock.svelte";

  type $$Slots = {
    default: Record<string, never>;
  };
</script>

<div class="w-full h-full overflow-y-auto">
  <TokenBlock />
  <ShortcutBlock />
  <ActionBlock />
  <div class="hidden">
    <slot />
  </div>
</div>
