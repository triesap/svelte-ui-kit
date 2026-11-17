<script lang="ts">
  import { fieldContext } from "./context.js";
  import type { FieldRequiredProps } from "./types.js";
  let {
    ref = $bindable(null),
    class: className,
    ...rest
  }: FieldRequiredProps = $props();
  const context = fieldContext(true)!;
</script>

{#if context.required}<span
    {...rest}
    bind:this={ref}
    class={["kit-field-required", className]}
    aria-hidden="true">*</span
  >{/if}
