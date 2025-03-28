<script lang="ts">
  import Switch from "./Switch.svelte";

  export let id: string;
  export let label: string;
  export let checked: boolean | undefined = undefined;
</script>

<div class="p-3 flex items-center">
  <Switch {id} bind:checked />
  <label class="ml-3 cursor-pointer" for={id}>{label}</label>
</div>
