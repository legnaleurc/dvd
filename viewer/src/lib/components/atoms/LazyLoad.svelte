<script lang="ts">
  import type { SvelteComponentModule } from "$lib/types/traits";

  type $$Slots = {
    pending: Record<string, never>;
    fullfilled: Record<string, never>;
  };

  export let lazy: () => Promise<SvelteComponentModule>;

  $: load = lazy();
</script>

{#await load}
  <slot name="pending" />
{:then module_}
  <svelte:component this={module_.default}>
    <slot name="fullfilled" />
  </svelte:component>
{/await}
