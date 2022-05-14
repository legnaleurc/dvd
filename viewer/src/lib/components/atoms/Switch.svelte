<script lang="ts">
  export let id: string = "";
  export let checked: boolean = undefined;
  export let disabled: boolean = undefined;
</script>

<input type="checkbox" role="switch" {id} {disabled} bind:checked />

<style lang="scss">
  input[type="checkbox"][role="switch"] {
    width: 2em;
    height: 1em;

    border-radius: 2em;

    background-repeat: no-repeat;
    background-size: contain;
    background-color: #000;

    transition: background-color 150ms ease;

    appearance: none;
    // color-adjust: exact;

    cursor: pointer;

    &::after {
      content: "";

      display: block;
      height: 1em;
      width: 1em;

      position: relative;
      top: 0em;
      left: 0em;

      border-radius: 50%;

      background-color: gray;
      transition: background-color 250ms ease, left 250ms ease;
    }

    &:checked {
      background-color: gray;

      &::after {
        left: 1em;
        background-color: white;
      }
    }

    &:disabled {
      pointer-events: none;
      filter: none;
      opacity: 0.5;
    }
  }
</style>
