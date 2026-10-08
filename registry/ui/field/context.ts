import { getContext, hasContext } from "svelte";

export const FIELD_CONTEXT = Symbol("svelte-ui-kit.field");
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
