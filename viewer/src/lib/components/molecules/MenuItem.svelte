<script lang="ts">
  let klass = "";
  export { klass as class };
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="p-3 cursor-pointer hover:bg-action-hover {klass}" on:click>
  <slot />
</div>
