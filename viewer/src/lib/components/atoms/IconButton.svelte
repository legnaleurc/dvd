<script lang="ts">
  import type { Variants } from "$lib/types/button";

  export let disabled = false;
  export let variant: Variants = "primary";

  let color = "";

  $: {
    switch (variant) {
      case "danger":
        color = "text-danger-500";
        break;
      default:
        color = "";
    }
  }
</script>

<button
  class="w-12 h-12 p-3 rounded-full flex-0 inline-flex justify-center items-center {color} disabled:opacity-30"
  {disabled}
  on:click
>
  <slot />
</button>
