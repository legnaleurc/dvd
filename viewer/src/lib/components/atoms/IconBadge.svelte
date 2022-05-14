<script lang="ts">
  import type { Variants } from "$lib/types/button";

  export let count: number;
  export let variant: Variants = "vanilla";

  let bgColor: string = "";

  $: {
    switch (variant) {
      case "primary":
        bgColor = "bg-primary-500";
        break;
      case "warning":
        bgColor = "bg-warning-500";
        break;
      case "danger":
        bgColor = "bg-danger-500";
        break;
      default:
        bgColor = "";
    }
  }
</script>

<span class="inline-flex relative">
  <slot />
  <span
    class="flex absolute top-0 right-0 translate-x-2/4 -translate-y-2/4 h-4 px-1 rounded-full text-xs {bgColor}"
    class:hidden={count <= 0}>{count}</span
  >
</span>
