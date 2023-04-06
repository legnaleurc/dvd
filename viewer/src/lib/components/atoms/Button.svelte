<script lang="ts">
  import type { Variants } from "$types/button";
  import Icon from "./Icon.svelte";

  export let label: string;
  export let icon: string;
  export let variant: Variants = "vanilla";
  export let disabled = false;

  $: isPrimary = variant === "primary";
  $: isDanger = variant === "danger";
</script>

<button
  class="p-3 w-36 flex disabled:opacity-30"
  class:bg-blue-500={isPrimary}
  class:bg-red-500={isDanger}
  {disabled}
  on:click
>
  <Icon name={icon} />
  <span class="flex-1 inline-flex justify-center items-center">{label}</span>
</button>
