<script lang="ts">
  import type { Variants } from "$types/button";

  export let variant: Variants = "vanilla";
  export let disabled = false;

  $: isPrimary = variant === "primary";
  $: isSecondary = variant === "secondary";
  $: isDanger = variant === "danger";
</script>

<button
  class="w-24 h-12 p-3 flex items-center justify-center disabled:opacity-30"
  class:bg-blue-500={isPrimary}
  class:bg-gray-600={isSecondary}
  class:bg-red-500={isDanger}
  {disabled}
  on:click
>
  <slot />
</button>
