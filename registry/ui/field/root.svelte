<script lang="ts">
  import { setContext } from "svelte";
  import { FIELD_CONTEXT, type FieldContext } from "./context.js";
  import FieldMessage from "./message.svelte";
  import type { FieldRootProps } from "./types.js";
  let {
    id,
    controlId,
    required = false,
    invalid = false,
    disabled = false,
    messages = [],
    ref = $bindable(null),
    class: className,
    children,
    ...rest
  }: FieldRootProps = $props();
  const generatedId = $props.id();
  const base = $derived(id ?? generatedId);
  const messageId = (key: string) =>
    `${base}-message-${encodeURIComponent(key)}`;
  const describedBy = $derived(
    messages.map((message) => messageId(message.key)).join(" ") || undefined,
  );
  const context: FieldContext = {
    get controlId() {
      return controlId ?? `${base}-control`;
    },
    get describedBy() {
      return describedBy;
    },
    get required() {
      return required;
    },
    get invalid() {
      return invalid;
    },
    get disabled() {
      return disabled;
    },
  };
  setContext(FIELD_CONTEXT, context);
</script>

<div
  {...rest}
  id={base}
  bind:this={ref}
  class={["kit-field", className]}
  data-required={required ? "true" : undefined}
  data-invalid={invalid ? "true" : undefined}
  data-disabled={disabled ? "true" : undefined}
>
  {@render children(context)}
  {#each messages as message (message.key)}
    {@const { key, ...props } = message}
    <FieldMessage
      {...props}
      id={messageId(key)}
      bind:ref={
        () => message.ref ?? null,
        (node) => {
          if (Object.hasOwn(message, "ref")) message.ref = node;
        }
      }
    />
  {/each}
</div>
