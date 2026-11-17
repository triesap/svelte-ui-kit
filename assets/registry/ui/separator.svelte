<script lang="ts">
  import type { SeparatorProps } from "./separator.types.js";
  let {
    orientation = "horizontal",
    decorative = false,
    ref = $bindable(null),
    class: className,
    ...rest
  }: SeparatorProps = $props();
</script>

<div
  {...rest}
  bind:this={ref}
  class={["kit-separator", className]}
  role={decorative ? "none" : "separator"}
  aria-hidden={decorative ? true : rest["aria-hidden"]}
  aria-orientation={decorative ? undefined : orientation}
  data-orientation={orientation}
></div>
