<script lang="ts">
  import type { NeverRecord, SvelteComponentModule } from "$types/traits";

  type $$Slots = {
    pending: NeverRecord;
    fullfilled: NeverRecord;
  };

  export let lazy: () => Promise<SvelteComponentModule>;

  $: load = lazy();
</script>

{#await load}
  <slot name="pending" />
{:then module_}
  {#if $$slots.fullfilled}
    <svelte:component this={module_.default}>
      <slot name="fullfilled" />
    </svelte:component>
  {:else}
    <svelte:component this={module_.default} />
  {/if}
{/await}
