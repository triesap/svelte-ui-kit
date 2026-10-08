<script lang="ts">
  import { DropdownMenu as BitsMenu } from "bits-ui";
  import type { MenuRadioItemProps } from "./types.js";
  let {
    ref = $bindable(null),
    class: className,
    ...rest
  }: MenuRadioItemProps = $props();
</script>

<BitsMenu.RadioItem
  {...rest}
  bind:ref
  class={["kit-menu-item", "kit-menu-radio-item", className]}
/>
