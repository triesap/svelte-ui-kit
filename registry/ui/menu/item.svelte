<script lang="ts">
  import { DropdownMenu as BitsMenu } from "bits-ui";
  import type { MenuItemProps } from "./types.js";
  let {
    ref = $bindable(null),
    class: className,
    ...rest
  }: MenuItemProps = $props();
</script>

<BitsMenu.Item {...rest} bind:ref class={["kit-menu-item", className]} />
