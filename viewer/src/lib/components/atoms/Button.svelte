<script lang="ts">
  import type { Variants } from "$types/button";
  import Icon from "./Icon.svelte";

  export let label: string;
  export let icon: string;
  export let variant: Variants = "vanilla";
  export let disabled = false;

  $: hasLabel = !!label;
  $: isPrimary = variant === "primary";
  $: isSecondary = variant === "secondary";
  $: isDanger = variant === "danger";
</script>

<button
  class="p-3 flex disabled:opacity-30"
  class:w-36={hasLabel}
  class:bg-blue-500={isPrimary}
  class:bg-gray-600={isSecondary}
  class:bg-red-500={isDanger}
  {disabled}
  on:click
>
  <Icon name={icon} />
  {#if hasLabel}
    <span class="flex-1 inline-flex justify-center items-center">{label}</span>
  {/if}
</button>
