<script lang="ts">
  import type { MenuItemIndicatorProps } from "./types.js";
  let {
    checked,
    ref = $bindable(null),
    class: className,
    children,
    ...rest
  }: MenuItemIndicatorProps = $props();
</script>

<span
  {...rest}
  bind:this={ref}
  hidden={!checked}
  data-state={checked ? "checked" : "unchecked"}
  class={["kit-menu-item-indicator", className]}
>
  {@render children?.()}
</span>
