<script lang="ts">
  import FieldRoot from "./root.svelte";
  import FieldSurface from "./surface.svelte";
  import FieldLabel from "./label.svelte";
  import FieldRequired from "./required.svelte";
  import NativeSelect from "./native-select.svelte";
  import SelectIcon from "./select-icon.svelte";
  import type { SelectFieldProps } from "./types.js";
  let {
    id,
    label,
    selectedLabel,
    message,
    rootClass,
    surfaceClass,
    labelRowClass,
    labelClass,
    requiredClass,
    messageClass,
    labelAction,
    valueRowClass,
    valueClass,
    iconClass,
    icon,
    required,
    disabled,
    invalid = false,
    ref = $bindable(null),
    value = $bindable(undefined),
    children,
    ...rest
  }: SelectFieldProps = $props();
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
  <FieldSurface class={["kit-select-field-surface", surfaceClass]}>
    <span class={["kit-field-label-row", labelRowClass]}
      ><FieldLabel class={labelClass}
        >{label}<FieldRequired class={requiredClass} /></FieldLabel
      >{@render labelAction?.()}</span
    >
    <NativeSelect
      {...rest}
      {required}
      {disabled}
      {invalid}
      bind:value
      bind:ref
      class={["kit-select-field-native", rest.class]}
      >{@render children()}</NativeSelect
    >
    <span class={["kit-select-field-value-row", valueRowClass]}
      ><span class={["kit-select-field-value", valueClass]}
        >{selectedLabel}</span
      ></span
    >
    {#if icon}<SelectIcon class={iconClass}>{@render icon()}</SelectIcon>{/if}
  </FieldSurface>
</FieldRoot>
