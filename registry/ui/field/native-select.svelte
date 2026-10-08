<script lang="ts">
  import { fieldContext } from "./context.js";
  import type { NativeSelectProps } from "./types.js";
  let {
    ref = $bindable(null),
    value = $bindable(undefined),
    id,
    required,
    disabled,
    invalid,
    "aria-describedby": describedBy,
    "aria-invalid": ariaInvalid,
    class: className,
    children,
    ...rest
  }: NativeSelectProps = $props();
  const context = fieldContext();
  const generatedId = $props.id();
  const isInvalid = $derived(invalid ?? context?.invalid ?? false);
</script>

<select
  {...rest}
  id={id ?? context?.controlId ?? generatedId}
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
  class={["kit-field-control kit-native-select", className]}
  >{@render children()}</select
>
