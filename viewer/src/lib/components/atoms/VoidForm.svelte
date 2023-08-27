<script lang="ts">
  import type { NeverRecord } from "$types/traits";

  type $$Slots = {
    default: NeverRecord;
  };
</script>

<form class="contents" on:submit|preventDefault>
  <slot />
</form>
