<script lang="ts">
  let klass = "";
  export { klass as class };
</script>

<div class="p-3 cursor-pointer hover:bg-action-hover {klass}" on:click>
  <slot />
</div>
