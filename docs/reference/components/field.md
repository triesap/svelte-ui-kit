# FieldRoot

Native form controls, labels, owned dynamic messages and complete source convenience recipes.

## Install and compose

Installation ID: `field`. Explicit requests and dependency closure remain separate.

```svelte
<script lang="ts">
  import { TextField } from "$lib/components/ui";
</script>

<TextField label="Email" name="email" type="email" required />
```

## Public contract

Compose FieldRoot, FieldSurface, FieldLabel, FieldMessage and FieldRequired with TextInput, TextArea or NativeSelect, or use TextField/TextAreaField/SelectField recipes.
This is native Svelte, with no Bits dependency, validation engine, form store or provider counter.
FieldSlot is an optional native Snippet type; TextInputType is exactly text/email/password/search/tel/url.
Root owns keyed messages with required key/children and paragraph attrs (excluding id); both rendered paragraphs and describedBy derive from the same current list, including SSR.
Removing/reordering messages updates targets while preserving keyed DOM.
Reactive message descriptors can own refs; direct FieldMessage requires an explicit id.
Root's children receives controlId/describedBy/required/invalid/disabled.
Explicit native relationships/states, including false, override context; align explicit control IDs with controlId or Label for.
One control belongs to one Root.
Required and SelectIcon own aria-hidden; Surface, Required and implicit Label associations require Root.
No automatic live role or validation occurs.
Native input/textarea bind string value/ref, preserve actual typed events and defaultValue/form/name/reset; TextArea defaults rows=4.
NativeSelect is single string selection with option children; no multiple/defaultValue alias or new combobox API.
Convenience recipes require label/name; SelectField also requires selectedLabel and can compose an icon.
Native class styles the control; explicit root/surface/label/message/value-row classes style the recipe.
Initial value is current state, not an implicit reset default.
Canceled form.reset() preserves native text bindings; trusted reset-button clicks under pinned Svelte/Chromium can restore their defaults despite preventDefault, also reproduced by raw Svelte controls.
Checkbox/Switch/Radio guarded resets remain canceled.
No second text reset engine hides that boundary.

## Exports and installed assets

The [authoritative manifest](../../../registry/ui/field.json) owns this inventory.

| Export               | Kind  | Local target     |
| -------------------- | ----- | ---------------- |
| `FieldRoot`          | value | `field/index.ts` |
| `FieldSurface`       | value | `field/index.ts` |
| `FieldLabel`         | value | `field/index.ts` |
| `FieldMessage`       | value | `field/index.ts` |
| `FieldRequired`      | value | `field/index.ts` |
| `TextInput`          | value | `field/index.ts` |
| `TextArea`           | value | `field/index.ts` |
| `NativeSelect`       | value | `field/index.ts` |
| `SelectIcon`         | value | `field/index.ts` |
| `TextField`          | value | `field/index.ts` |
| `TextAreaField`      | value | `field/index.ts` |
| `SelectField`        | value | `field/index.ts` |
| `FieldRootProps`     | type  | `field/index.ts` |
| `FieldSurfaceProps`  | type  | `field/index.ts` |
| `FieldLabelProps`    | type  | `field/index.ts` |
| `FieldMessageProps`  | type  | `field/index.ts` |
| `FieldRequiredProps` | type  | `field/index.ts` |
| `TextInputProps`     | type  | `field/index.ts` |
| `TextAreaProps`      | type  | `field/index.ts` |
| `NativeSelectProps`  | type  | `field/index.ts` |
| `SelectIconProps`    | type  | `field/index.ts` |
| `TextFieldProps`     | type  | `field/index.ts` |
| `TextAreaFieldProps` | type  | `field/index.ts` |
| `SelectFieldProps`   | type  | `field/index.ts` |
| `FieldSlot`          | type  | `field/index.ts` |
| `TextInputType`      | type  | `field/index.ts` |

Registry dependencies: `tokens`.
Npm requirements: none.

- [Authored field/root.svelte](../../../registry/ui/field/root.svelte)
- [Authored field/surface.svelte](../../../registry/ui/field/surface.svelte)
- [Authored field/label.svelte](../../../registry/ui/field/label.svelte)
- [Authored field/message.svelte](../../../registry/ui/field/message.svelte)
- [Authored field/required.svelte](../../../registry/ui/field/required.svelte)
- [Authored field/text-input.svelte](../../../registry/ui/field/text-input.svelte)
- [Authored field/text-area.svelte](../../../registry/ui/field/text-area.svelte)
- [Authored field/native-select.svelte](../../../registry/ui/field/native-select.svelte)
- [Authored field/select-icon.svelte](../../../registry/ui/field/select-icon.svelte)
- [Authored field/text-field.svelte](../../../registry/ui/field/text-field.svelte)
- [Authored field/text-area-field.svelte](../../../registry/ui/field/text-area-field.svelte)
- [Authored field/select-field.svelte](../../../registry/ui/field/select-field.svelte)
- [Authored field/types.ts](../../../registry/ui/field/types.ts)
- [Authored field/context.ts](../../../registry/ui/field/context.ts)
- [Authored field/index.ts](../../../registry/ui/field/index.ts)
- [Managed field CSS](../../../registry/styles/field.css)

Source adaptations preserve the original named surface: `FieldLabel`, `FieldMessage`, `FieldRequired`, `FieldRoot`, `FieldSlot`, `FieldSurface`, `NativeSelect`, `SelectField`, `SelectIcon`, `TextArea`, `TextAreaField`, `TextField`, `TextInput`, `TextInputType`. The names here describe source attribution, not extra target aliases.

## Source styling and fallback contracts

These source observations retain exact fallback order. Application overrides and semantic defaults are distinct.

| Property                                 | Grammar                                                                                                             | Source fallback                                                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| --kit-field-surface-radius               | `<length-percentage>{1,4} [ / <length-percentage>{1,4} ]? \| inherit \| initial \| unset \| revert \| revert-layer` | `var(--kit-radius-surface, var(--kit-radius-default, var(--kit-field-control-radius, var(--kit-radius-md))))` |
| --kit-field-control-radius               | `<length-percentage>{1,4} [ / <length-percentage>{1,4} ]? \| inherit \| initial \| unset \| revert \| revert-layer` | `var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md)))`                                  |
| --kit-input-radius                       | `<length-percentage>{1,4} [ / <length-percentage>{1,4} ]? \| inherit \| initial \| unset \| revert \| revert-layer` | `var(--kit-field-control-radius, var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md))))` |
| --kit-select-radius                      | `<length-percentage>{1,4} [ / <length-percentage>{1,4} ]? \| inherit \| initial \| unset \| revert \| revert-layer` | `var(--kit-field-control-radius, var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md))))` |
| --kit-textarea-radius                    | `<length-percentage>{1,4} [ / <length-percentage>{1,4} ]? \| inherit \| initial \| unset \| revert \| revert-layer` | `var(--kit-field-control-radius, var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md))))` |
| --kit-field-gap                          | `<length-percentage>`                                                                                               | `0.5rem`                                                                                                      |
| --kit-field-disabled-opacity             | `<number>`                                                                                                          | `var(--kit-disabled-opacity)`                                                                                 |
| --kit-field-surface-border-width         | `<length-percentage>`                                                                                               | `0`                                                                                                           |
| --kit-field-surface-border-color         | `<color>`                                                                                                           | `transparent`                                                                                                 |
| --kit-field-surface-padding-block        | `<length-percentage>`                                                                                               | `var(--kit-field-control-padding-block, 0.625rem)`                                                            |
| --kit-field-control-padding-block        | `<length-percentage>`                                                                                               | `0.625rem`                                                                                                    |
| --kit-field-surface-padding-inline       | `<length-percentage>`                                                                                               | `var(--kit-field-control-padding-inline, 0.75rem)`                                                            |
| --kit-field-control-padding-inline       | `<length-percentage>`                                                                                               | `0.75rem`                                                                                                     |
| --kit-field-surface-background           | `<color>`                                                                                                           | `var(--kit-field-control-background, var(--kit-color-surface))`                                               |
| --kit-field-control-background           | `<color>`                                                                                                           | `var(--kit-color-surface)`                                                                                    |
| --kit-field-label-gap                    | `<length-percentage>`                                                                                               | `0.25rem`                                                                                                     |
| --kit-field-label-color                  | `<color>`                                                                                                           | `var(--kit-color-text)`                                                                                       |
| --kit-field-label-font-size              | `<length-percentage>`                                                                                               | `0.9375rem`                                                                                                   |
| --kit-field-label-font-weight            | `<number>`                                                                                                          | `500`                                                                                                         |
| --kit-field-required-color               | `<color>`                                                                                                           | `var(--kit-color-danger)`                                                                                     |
| --kit-field-control-border-width         | `<length-percentage>`                                                                                               | `var(--kit-border-width)`                                                                                     |
| --kit-field-control-border-color         | `<color>`                                                                                                           | `var(--kit-color-border)`                                                                                     |
| --kit-field-control-min-height           | `<length-percentage>`                                                                                               | `2.75rem`                                                                                                     |
| --kit-field-control-color                | `<color>`                                                                                                           | `var(--kit-color-text)`                                                                                       |
| --kit-field-control-font-size            | `<length-percentage>`                                                                                               | `1rem`                                                                                                        |
| --kit-field-control-font-weight          | `<number>`                                                                                                          | `400`                                                                                                         |
| --kit-field-control-line-height          | `<number>`                                                                                                          | `1.35`                                                                                                        |
| --kit-field-control-transition-duration  | `<time>`                                                                                                            | `var(--kit-duration-fast)`                                                                                    |
| --kit-field-control-transition-timing    | `<easing-function>`                                                                                                 | `var(--kit-easing-standard)`                                                                                  |
| --kit-field-control-focus-ring           | `<color>`                                                                                                           | `var(--kit-focus-ring)`                                                                                       |
| --kit-field-control-invalid-border-color | `<color>`                                                                                                           | `var(--kit-color-danger)`                                                                                     |
| --kit-text-area-min-block-size           | `<length-percentage>`                                                                                               | `7rem`                                                                                                        |
| --kit-select-icon-inline-end             | `<length-percentage>`                                                                                               | `var(--kit-field-control-padding-inline, 0.75rem)`                                                            |
| --kit-select-icon-size                   | `<length-percentage>`                                                                                               | `1rem`                                                                                                        |
| --kit-select-icon-color                  | `<color>`                                                                                                           | `currentColor`                                                                                                |
| --kit-field-message-color                | `<color>`                                                                                                           | `var(--kit-color-text-muted)`                                                                                 |
| --kit-field-message-font-size            | `<length-percentage>`                                                                                               | `0.875rem`                                                                                                    |
| --kit-field-message-font-weight          | `<number>`                                                                                                          | `400`                                                                                                         |
| --kit-field-message-line-height          | `<number>`                                                                                                          | `1.35`                                                                                                        |
| --kit-field-message-invalid-color        | `<color>`                                                                                                           | `var(--kit-color-danger)`                                                                                     |

## Verification and limits

Read [styling](../../guides/styling.md) and [compatibility](../compatibility.md) before relying on theme, portal, native-reset, CSP or SSR guarantees.
Local behavioral evidence is bounded to the tested native graph and platforms; a type check or successful CLI transaction does not certify arbitrary application behavior.

- [Owning tests/components/field-css.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/field-css.test.ts)
- [Owning tests/components/field-parts.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/field-parts.test.ts)
- [Owning tests/components/field-types.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/field-types.test.ts)
- [Owning tests/integration/field-install.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/integration/field-install.test.ts)
- [Owning tests/integration/field-ssr.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/integration/field-ssr.test.ts)
- [Owning tests/browser/field-candidate.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/field-candidate.spec.ts)
- [Owning tests/browser/field-description-control.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/field-description-control.spec.ts)
- [Owning tests/browser/field-styles.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/field-styles.spec.ts)
- [Owning tests/browser/field.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/field.spec.ts)
