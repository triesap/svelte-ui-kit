<script lang="ts">
  import { setContext } from "svelte";
  import {
    FIELD_CONTEXT,
    uniqueMessages,
    type FieldContext,
  } from "./context.js";
  import OwnedMessage from "./owned-message.svelte";
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
  const ownedMessages = $derived(uniqueMessages(messages));
  const describedBy = $derived(
    ownedMessages.map((message) => messageId(message.key)).join(" ") ||
      undefined,
  );
  function attachRef(
    owner: NonNullable<FieldRootProps["messages"]>[number],
    node: HTMLParagraphElement,
  ) {
    if (!Object.hasOwn(owner, "ref")) return;
    owner.ref = node;
    return () => {
      if (owner.ref === node) owner.ref = null;
    };
  }
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
  {#each ownedMessages as message (message.key)}
    <OwnedMessage {message} id={messageId(message.key)} {attachRef} />
  {/each}
</div>
