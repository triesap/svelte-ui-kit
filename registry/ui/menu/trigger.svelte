<script lang="ts">
  import { DropdownMenu as BitsMenu } from "bits-ui";
  import type { MenuTriggerProps } from "./types.js";

  let {
    ref = $bindable(null),
    type = "button",
    class: className,
    ...rest
  }: MenuTriggerProps = $props();
</script>

<BitsMenu.Trigger
  {...rest}
  bind:ref
  {type}
  class={["kit-menu-trigger", className]}
/>
