import { getContext, hasContext } from "svelte";

export const FIELD_CONTEXT = Symbol("svelte-ui-kit.field");
/** Pure validation shared by the Root's rendered messages and relationships. */
export function uniqueMessages<Message extends { readonly key: string }>(
  messages: readonly Message[],
): readonly Message[] {
  const keys = new Set<string>();
  for (const message of messages) {
    if (keys.has(message.key))
      throw new Error("FieldRoot message keys must be unique.");
    keys.add(message.key);
  }
  return messages;
}
export interface FieldContext {
  readonly controlId: string;
  readonly describedBy: string | undefined;
  readonly required: boolean;
  readonly disabled: boolean;
  readonly invalid: boolean;
}
export function fieldContext(required = false): FieldContext | undefined {
  const context = hasContext(FIELD_CONTEXT)
    ? getContext<FieldContext>(FIELD_CONTEXT)
    : undefined;
  if (required && !context)
    throw new Error("This Field part requires FieldRoot.");
  return context;
}
