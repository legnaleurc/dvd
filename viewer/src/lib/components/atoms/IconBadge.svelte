<script lang="ts">
  export let count: number;
</script>

<span class="inline-flex relative">
  <slot />
  <span
    class="flex absolute top-0 right-0 translate-x-2/4 -translate-y-2/4 h-4 px-1 rounded-full text-xs bg-primary-500"
    class:hidden={count <= 0}>{count}</span
  >
</span>
