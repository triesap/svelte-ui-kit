<script lang="ts">
  import type { SelectIconProps } from "./types.js";
  let {
    ref = $bindable(null),
    class: className,
    children,
    ...rest
  }: SelectIconProps = $props();
</script>

<span
  {...rest}
  bind:this={ref}
  class={["kit-select-icon", className]}
  aria-hidden="true">{@render children()}</span
>
