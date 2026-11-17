<script lang="ts">
  import { DropdownMenu as BitsMenu } from "bits-ui";
  import type { MenuContentProps } from "./types.js";

  let {
    ref = $bindable(null),
    class: className,
    side = "bottom",
    align = "start",
    sideOffset = 4,
    collisionPadding = 8,
    ...rest
  }: MenuContentProps = $props();
</script>

<BitsMenu.Content
  {...rest}
  bind:ref
  {side}
  {align}
  {sideOffset}
  {collisionPadding}
  class={["kit-menu-content", className]}
/>
