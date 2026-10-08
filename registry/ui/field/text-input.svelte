<script lang="ts">
  import { fieldContext } from "./context.js";
  import type { TextInputProps } from "./types.js";
  let {
    ref = $bindable(null),
    value = $bindable(undefined),
    id,
    type = "text",
    required,
    disabled,
    invalid,
    "aria-describedby": describedBy,
    "aria-invalid": ariaInvalid,
    class: className,
    ...rest
  }: TextInputProps = $props();
  const context = fieldContext();
  const generatedId = $props.id();
  const isInvalid = $derived(invalid ?? context?.invalid ?? false);
</script>

<input
  {...rest}
  id={id ?? context?.controlId ?? generatedId}
  {type}
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
  class={["kit-field-control kit-text-input", className]}
/>
