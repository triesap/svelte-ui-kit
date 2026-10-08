<script lang="ts">
  import type { StatusProps } from "./status.types.js";
  let {
    children,
    role = "status",
    politeness = "polite",
    atomic = true,
    "aria-live": ariaLive = politeness,
    "aria-atomic": ariaAtomic = atomic,
    ref = $bindable(null),
    class: className,
    ...rest
  }: StatusProps = $props();
</script>

<p
  {...rest}
  bind:this={ref}
  class={["kit-status", className]}
  {role}
  aria-live={ariaLive}
  aria-atomic={ariaAtomic}
>
  {@render children()}
</p>
