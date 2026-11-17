import type { Snippet } from "svelte";
import type { ClassValue, SvelteHTMLElements } from "svelte/elements";

/** Source FieldSlot becomes a native optional snippet, not a runtime store. */
export type FieldSlot = Snippet;
export type TextInputType =
  "text" | "email" | "password" | "search" | "tel" | "url";

type States = { required?: boolean; disabled?: boolean; invalid?: boolean };
type Relationship = {
  controlId: string;
  describedBy: string | undefined;
  required: boolean;
  disabled: boolean;
  invalid: boolean;
};
type Native<
  Tag extends keyof SvelteHTMLElements,
  Ref extends HTMLElement,
> = SvelteHTMLElements[Tag] & { ref?: Ref | null };

export type FieldMessageProps = Native<"p", HTMLParagraphElement> & {
  id: string;
  children: FieldSlot;
};
export type FieldRootProps = Omit<Native<"div", HTMLDivElement>, "children"> &
  States & {
    controlId?: string;
    children: Snippet<[Relationship]>;
    messages?: readonly (Omit<FieldMessageProps, "id"> & { key: string })[];
  };
export type FieldSurfaceProps = Native<"div", HTMLDivElement> & {
  children: FieldSlot;
};
export type FieldLabelProps = Native<"label", HTMLLabelElement> & {
  children: FieldSlot;
};
export type FieldRequiredProps = Omit<
  Native<"span", HTMLSpanElement>,
  "children" | "aria-hidden"
>;
export type SelectIconProps = Omit<
  Native<"span", HTMLSpanElement>,
  "aria-hidden"
> & { children: FieldSlot };

export type TextInputProps = Omit<
  Native<"input", HTMLInputElement>,
  "type" | "value" | "defaultValue" | "defaultvalue" | "children"
> & {
  type?: TextInputType;
  value?: string;
  defaultValue?: string;
  invalid?: boolean;
};
export type TextAreaProps = Omit<
  Native<"textarea", HTMLTextAreaElement>,
  "value" | "defaultValue" | "defaultvalue" | "children"
> & {
  value?: string;
  defaultValue?: string;
  invalid?: boolean;
};
export type NativeSelectProps = Omit<
  Native<"select", HTMLSelectElement>,
  "value" | "multiple" | "defaultValue" | "defaultvalue"
> & {
  value?: string;
  multiple?: false;
  invalid?: boolean;
  children: FieldSlot;
};

type Presentation = {
  label: string;
  name: string;
  message?: string | null;
  rootClass?: ClassValue;
  surfaceClass?: ClassValue;
  labelRowClass?: ClassValue;
  labelClass?: ClassValue;
  requiredClass?: ClassValue;
  messageClass?: ClassValue;
  labelAction?: FieldSlot;
};
export type TextFieldProps = TextInputProps & Presentation;
export type TextAreaFieldProps = TextAreaProps & Presentation;
export type SelectFieldProps = NativeSelectProps &
  Presentation & {
    selectedLabel: string;
    valueRowClass?: ClassValue;
    valueClass?: ClassValue;
    iconClass?: ClassValue;
    icon?: FieldSlot;
  };
