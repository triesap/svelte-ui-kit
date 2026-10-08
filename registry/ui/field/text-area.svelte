<script lang="ts">
  import { fieldContext } from "./context.js";
  import type { TextAreaProps } from "./types.js";
  let {
    ref = $bindable(null),
    value = $bindable(undefined),
    id,
    rows = 4,
    required,
    disabled,
    invalid,
    "aria-describedby": describedBy,
    "aria-invalid": ariaInvalid,
    class: className,
    ...rest
  }: TextAreaProps = $props();
  const context = fieldContext();
  const generatedId = $props.id();
  const isInvalid = $derived(invalid ?? context?.invalid ?? false);
</script>

<textarea
  {...rest}
  id={id ?? context?.controlId ?? generatedId}
  {rows}
  bind:value
  bind:this={ref}
  required={required === undefined ? context?.required : required}
  disabled={disabled === undefined ? context?.disabled : disabled}
  aria-describedby={describedBy === undefined
    ? context?.describedBy
    : describedBy}
  aria-invalid={ariaInvalid === undefined
    ? isInvalid
      ? "true"
      : undefined
    : ariaInvalid}
  data-invalid={isInvalid ? "true" : undefined}
  data-disabled={(disabled === undefined ? context?.disabled : disabled)
    ? "true"
    : undefined}
  class={["kit-field-control kit-text-area", className]}></textarea>
