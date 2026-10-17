<script lang="ts">
  import type { NeverRecord } from "#types/traits.js";

  type $$Slots = {
    default: NeverRecord;
  };
</script>

<form class="contents" on:submit|preventDefault>
  <slot />
</form>
