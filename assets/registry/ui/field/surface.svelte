<script lang="ts">
  import { fieldContext } from "./context.js";
  import type { FieldSurfaceProps } from "./types.js";
  let {
    ref = $bindable(null),
    class: className,
    children,
    ...rest
  }: FieldSurfaceProps = $props();
  const context = fieldContext(true)!;
</script>

<div
  {...rest}
  bind:this={ref}
  class={["kit-field-surface", className]}
  data-invalid={context.invalid ? "true" : undefined}
  data-disabled={context.disabled ? "true" : undefined}
>
  {@render children()}
</div>
