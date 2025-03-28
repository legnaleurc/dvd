<script lang="ts">
  import type { Variants } from "$types/button";

  export let disabled = false;
  export let variant: Variants = "vanilla";

  $: isDanger = variant === "danger";
</script>

<button
  class="w-12 h-12 p-3 rounded-full inline-flex justify-center items-center disabled:opacity-30 active:enabled:bg-pale-700"
  class:text-red-500={isDanger}
  {disabled}
  on:click
>
  <slot />
</button>
