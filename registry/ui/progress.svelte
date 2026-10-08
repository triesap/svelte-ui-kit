<script lang="ts">
  import type { ProgressProps } from "./progress.types.js";
  let {
    value,
    max = 100,
    ref = $bindable(null),
    class: className,
    ...rest
  }: ProgressProps = $props();
</script>

<progress
  {...rest}
  bind:this={ref}
  class={["kit-progress", className]}
  {value}
  {max}>{value == null ? "" : `${value} / ${max ?? 1}`}</progress
>
