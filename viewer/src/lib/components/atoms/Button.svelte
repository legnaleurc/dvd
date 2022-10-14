<script lang="ts">
  import type { Variants } from "$types/button";
  import Icon from "./Icon.svelte";

  export let label: string;
  export let icon: string;
  export let variant: Variants = "vanilla";
  export let disabled = false;

  let color = "";
  let bgColor = "";

  $: {
    switch (variant) {
      case "primary":
        color = "";
        bgColor = "bg-primary-500";
        break;
      case "danger":
        color = "";
        bgColor = "bg-danger-500";
        break;
      default:
        color = "";
        bgColor = "";
    }
  }
</script>

<button
  class="p-3 w-36 flex {color} {bgColor} disabled:opacity-30"
  {disabled}
  on:click
>
  <Icon name={icon} />
  <span class="flex-1 inline-flex justify-center items-center">{label}</span>
</button>
