<script lang="ts">
  import Icon from "$atoms/Icon.svelte";
  import RoundedButton from "$atoms/RoundedButton.svelte";
  import SortMenu from "./SortMenu.svelte";
</script>

<SortMenu>
  <RoundedButton popovertarget="sort-menu">
    <Icon name="sort" />
  </RoundedButton>
</SortMenu>
