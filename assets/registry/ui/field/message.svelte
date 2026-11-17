<script lang="ts">
  import { fieldContext } from "./context.js";
  import type { FieldMessageProps } from "./types.js";
  let {
    ref = $bindable(null),
    class: className,
    children,
    ...rest
  }: FieldMessageProps = $props();
  const context = fieldContext();
</script>

<p
  {...rest}
  bind:this={ref}
  class={["kit-field-message", className]}
  data-invalid={context?.invalid ? "true" : undefined}
  data-disabled={context?.disabled ? "true" : undefined}
>
  {@render children()}
</p>
