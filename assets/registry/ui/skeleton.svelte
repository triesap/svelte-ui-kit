<script lang="ts">
  import type { SkeletonProps } from "./skeleton.types.js";
  let {
    ref = $bindable(null),
    class: className,
    ...rest
  }: SkeletonProps = $props();
</script>

<span
  {...rest}
  bind:this={ref}
  class={["kit-skeleton", className]}
  aria-hidden="true"
></span>
