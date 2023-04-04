<script lang="ts">
  type $$Events = {
    click: MouseEvent;
  };

  let klass = "";
  export { klass as class };
</script>

<button
  role="menuitem"
  class="p-3 cursor-pointer hover:bg-pale-600 {klass}"
  on:click
>
  <slot />
</button>
