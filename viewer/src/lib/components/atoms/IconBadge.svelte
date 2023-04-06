<script lang="ts">
  import type { Variants } from "$types/button";

  export let count: number;
  export let variant: Variants = "vanilla";

  $: countText = count > 100 ? "99+" : `${count}`;
  $: isPrimary = variant === "primary";
  $: isWarning = variant === "warning";
  $: isDanger = variant === "danger";
</script>

<span class="inline-flex relative">
  <slot />
  <span
    class="flex absolute top-0 right-0 translate-x-2/4 -translate-y-2/4 h-4 px-1 rounded-full text-xs"
    class:bg-blue-500={isPrimary}
    class:bg-yellow-500={isWarning}
    class:bg-red-500={isDanger}
    class:hidden={count <= 0}>{countText}</span
  >
</span>
