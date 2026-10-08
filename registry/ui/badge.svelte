<script lang="ts">
  import type { BadgeProps } from "./badge.types.js";
  let {
    children,
    ref = $bindable(null),
    class: className,
    ...rest
  }: BadgeProps = $props();
</script>

<span {...rest} bind:this={ref} class={["kit-badge", className]}>
  {@render children()}
</span>
