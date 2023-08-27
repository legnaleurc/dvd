<script lang="ts">
  import type { NeverRecord } from "$types/traits";
  import ActionBlock from "./ActionBlock.svelte";
  import ShortcutBlock from "./ShortcutBlock.svelte";
  import TokenBlock from "./TokenBlock.svelte";

  type $$Slots = {
    default: NeverRecord;
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
