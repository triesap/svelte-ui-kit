<script lang="ts">
  import FieldRoot from "./root.svelte";
  import FieldSurface from "./surface.svelte";
  import FieldLabel from "./label.svelte";
  import FieldRequired from "./required.svelte";
  import TextInput from "./text-input.svelte";
  import type { TextFieldProps } from "./types.js";
  let {
    id,
    label,
    message,
    rootClass,
    surfaceClass,
    labelRowClass,
    labelClass,
    requiredClass,
    messageClass,
    labelAction,
    required,
    disabled,
    invalid = false,
    ref = $bindable(null),
    value = $bindable(undefined),
    ...rest
  }: TextFieldProps = $props();
</script>

{#snippet messageBody()}{message}{/snippet}
<FieldRoot
  {id}
  required={!!required}
  disabled={!!disabled}
  {invalid}
  class={rootClass}
  messages={message == null
    ? []
    : [{ key: "message", children: messageBody, class: messageClass }]}
>
  <FieldSurface class={surfaceClass}>
    <span class={["kit-field-label-row", labelRowClass]}
      ><FieldLabel class={labelClass}
        >{label}<FieldRequired class={requiredClass} /></FieldLabel
      >{@render labelAction?.()}</span
    >
    <TextInput {...rest} {required} {disabled} {invalid} bind:value bind:ref />
  </FieldSurface>
</FieldRoot>
