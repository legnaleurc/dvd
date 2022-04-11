<script lang="ts" context="module">
  type IconStyle = "outlined" | "filled";

  function getIconStyle(style: string) {
    if (!style || style === "filled") {
      return "material-icons";
    }
    return `material-icons-${style}`;
  }
</script>

<script lang="ts">
  export let name: string;
  export let style: IconStyle = undefined;

  $: iconStyle = getIconStyle(style);
</script>

<span class={iconStyle}>{name}</span>
