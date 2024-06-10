<script lang="ts">
  import Icon from "$atoms/Icon.svelte";
  import RoundedButton from "$atoms/RoundedButton.svelte";
  import SortMenu from "./SortMenu.svelte";
</script>

<SortMenu let:show>
  <RoundedButton on:click={(event) => show(event.clientX, event.clientY)}>
    <Icon name="sort" />
  </RoundedButton>
</SortMenu>
