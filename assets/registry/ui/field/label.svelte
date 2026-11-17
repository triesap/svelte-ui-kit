<script lang="ts">
  import { fieldContext } from "./context.js";
  import type { FieldLabelProps } from "./types.js";
  let {
    ref = $bindable(null),
    for: target,
    class: className,
    children,
    ...rest
  }: FieldLabelProps = $props();
  const context = fieldContext();
  const controlTarget = $derived.by(() => {
    if (target === undefined && !context)
      throw new Error("FieldLabel requires FieldRoot or an explicit for.");
    return target === undefined ? context?.controlId : target;
  });
</script>

<label
  {...rest}
  for={controlTarget}
  bind:this={ref}
  class={["kit-field-label", className]}
  data-disabled={context?.disabled ? "true" : undefined}
  >{@render children()}</label
>
