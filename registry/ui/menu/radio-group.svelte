<script lang="ts">
  import { DropdownMenu as BitsMenu } from "bits-ui";
  import type { MenuRadioGroupProps } from "./types.js";
  let {
    value = $bindable(""),
    ref = $bindable(null),
    class: className,
    ...rest
  }: MenuRadioGroupProps = $props();
</script>

<BitsMenu.RadioGroup
  {...rest}
  bind:value
  bind:ref
  class={["kit-menu-radio-group", className]}
/>
