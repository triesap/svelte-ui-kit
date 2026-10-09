# Field native controls, messages and source composition contract

Current qualification status: original family gates, the selected native
baseline and local MVP are independently accepted through S203.
[Final qualification](../../implementation/evidence/RCLD-11_QUALIFICATION.md)
is anchored at `f756d227b6a1dce1396183dec4db138a256e16bf`. Checkpoint-era pending/gated statements below
retain historical provenance and do not reopen completed gates.
[Native/source boundaries](../../implementation/evidence/COMPATIBILITY.md#current-native-and-source-boundaries)
and documented platform limits remain explicit.

Pinned source [family](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/ui/field/mod.rs),
[manifest](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/ui/field.json)
and [CSS](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/styles/field.css)
define all fourteen original exports. Every source file listed below was
inspected at that revision. Preserve MIT attribution and all source CSS geometry,
state selectors, hooks and fallback chains. This family uses native Svelte5.57.1
elements, typed DOM events and request-safe `$props.id()` identity. It does not
need Bits, a schema engine, form store, global counter or identity shim.

## Complete source mapping

All component names have a corresponding Props type. Twelve Svelte files,
types.ts, context.ts and index.ts form one complete source/style/export cohort
with styles/field.css. Tokens is the only registry dependency; there is no new
npm dependency. FieldSlot and TextInputType are types, not fake runtime exports.

| Source export/file                 | Svelte target          | Markup and disposition                                                                 |
| ---------------------------------- | ---------------------- | -------------------------------------------------------------------------------------- |
| FieldRoot / root.rs                | root.svelte            | Native div; required/invalid/disabled context and message ownership                    |
| FieldSurface / surface.rs          | surface.svelte         | Native div; actual invalid/disabled attributes                                         |
| FieldLabel / label.rs              | label.svelte           | Native label targeting the actual control ID                                           |
| FieldMessage / message.rs          | message.svelte         | Native p with explicit id and native content/attrs; Root owns active message rendering |
| FieldRequired / required.rs        | required.svelte        | Required-only aria-hidden span containing *                                            |
| FieldSlot / slot.rs                | types.ts               | Native Snippet type; optional snippets replace Rust Arc/empty/is_present/render APIs   |
| TextInput / text_input.rs          | text-input.svelte      | Native input, bind:value/ref, six source text input types                              |
| TextInputType / text_input.rs      | types.ts               | Exactly text/email/password/search/tel/url string union                                |
| TextArea / text_area.rs            | text-area.svelte       | Native textarea, bind:value/ref, rows default4                                         |
| NativeSelect / native_select.rs    | native-select.svelte   | Native single select, string bind:value/ref and option children                        |
| SelectIcon / native_select.rs      | select-icon.svelte     | Native aria-hidden span with caller icon snippet                                       |
| TextField / text_field.rs          | text-field.svelte      | Root/surface/label/required/input/message recipe with native input attrs/ref           |
| TextAreaField / text_area_field.rs | text-area-field.svelte | Same recipe with native textarea attrs/ref                                             |
| SelectField / select_field.rs      | select-field.svelte    | Actual native select plus source visible selected label/value row and optional icon    |

## Relationships and active message ownership

Implementation decision at S145: replace render-order-dependent Rust message
registration/ordinal context with an explicit Root-owned keyed message list.
Root messages are native paragraph props excluding id, plus a required key and
children snippet. Root derives both its described-by IDs and rendered paragraphs
from that same current list, including before any child renders on the server.
Removing a record removes its paragraph and reference in the same update;
reordering preserves keyed identities. It introduces no validation or form-state
engine and avoids claiming server effects already ran.
Message keys are encoded as ID segments. A descriptor with a ref property owns
that paragraph ref; use a reactive descriptor to observe its current ref and
cleanup. Direct FieldMessage supports ordinary bind:ref independently.

Root id is a caller base or native `$props.id()`; control ID defaults to
base-control and active messages to base-message-key. Explicit Root controlId
supports kit controls or a caller-selected native ID. Root children receive
controlId/describedBy/required/invalid/disabled; ordinary zero-argument children
also work. Low-level native controls inherit current Root relationships and
states. Explicit native id/required/disabled/aria-describedby and invalid override
context, including false. If overriding a control ID, match Root controlId or
FieldLabel for. One control belongs to one FieldRoot. Each extra control needs
its own Root or explicit caller relationships.

FieldMessage requires an explicit id, forwards paragraph attrs/ref/children and
inherits source invalid/disabled styling. Root renders owned messages after
children in source visual order. Independently composed paragraphs and explicit
aria-describedby are ordinary caller-owned native relationships: the caller
must render their targets. They are not silently registered through browser-only
effects. There is no automatic alert/live-region role in the source; native
role/aria-live remain caller props. Invalid is presentation and aria-invalid,
not validation execution.

FieldLabel inherits Root controlId unless native for is supplied. Surface,
Required and implicit Label associations require a Root. Required and SelectIcon
pin aria-hidden=true; the marker renders only while Root required is true.
No synthetic accessible label, redundant field-level role or schema validator.

## Native controls, events and composition

TextInput/TextArea expose string bind:value and exact native input/textarea refs,
defaultValue, form/name/autocomplete/required/disabled/readonly and native event
handlers with actual typed currentTarget. Native value binding owns input and
reset ordering; no second reset bridge is introduced without an observed need.
TextArea rows defaults to4. Standalone controls use their own native stable ID
and no inherited relationships. NativeSelect remains single selection with
string binding, native option children, form attributes and change events.
Multiple selection and unsupported select defaultValue aliases are excluded;
option selected defaults and initial value remain native. This implements the
original native select, not the deferred new select/combobox extension.

Convenience fields require label and name, bind string value and the actual
native control ref, and forward remaining native attributes/events to that
control. Their id is the field base (control gets base-control). Native class
styles the control; rootClass/surfaceClass/labelRowClass/labelClass/requiredClass/
messageClass target source parts. Optional message string/null controls a single
Root-owned message. labelAction is a native optional snippet. SelectField requires
selectedLabel and offers valueRowClass/valueClass/iconClass and optional icon
snippet. Source invisible native select overlay, visible value row and decorative
icon remain CSS-owned; native select owns keyboard, focus, form and selection.

Preserve kit-field/surface/label/label-row/required/message/control, kit-text-input,
kit-text-area, kit-native-select and kit-select-field-surface/native/value-row/
value and kit-select-icon. Root has required/invalid/disabled data attributes;
surface/message inherit invalid/disabled; controls match actual disabled/invalid.
All source attrs use true when active and are absent otherwise.

S145 freezes types and source mapping only. Original S146 must measure markup,
SSR and refs; S147 installs the complete styled cohort; S148 qualifies native and
kit label activation, validation presentation, reset, dynamic messages, multiple
instances and actual hydration, then obtains separate independent acceptance.
No candidate inventory or author statement supplies that acceptance.

S146 actual candidate check/build and four server states measure every native
part, unique IDs, complete initial message targets and convenience-field labels.
Candidate Chromium measures actual refs, descriptor refs, native value/event
bindings, retained keyed helper DOM through error addition/removal, inherited
states with explicit false overrides and a changed control ID's live label.
The Label target is derived reactively; no compile warning is suppressed.
Complete registration and installed form/hydration qualification remain S147/S148.

S148 real default/custom CLI consumers coinstall Checkbox, Switch and Radio
explicitly, with every installed source byte and production identity checked.
Native labels activate the actual checkbox/switch/radio-item buttons; the Radio
Group additionally names its group with the rendered Plan label. Native required
validation focuses the visible kit control through its existing hidden field;
each named kit field submits once and disabled fields are omitted.

Native input/textarea defaultValue and option defaults define reset values.
Initial value is current bound state, not an implicit reset default; convenience
fields forward defaultValue to their native control. Raw native input/textarea/
select controls independently reproduce reset and cancellation behavior. Changing
native form ownership changes which form resets/submits those fields, including
coinstalled Checkbox/Switch. Radio keeps its actual native API and surrounding
form ownership; no unsupported form prop is added.

S184 additionally measures two cancelled-reset trigger paths with direct raw
Svelte controls. Application-invoked `form.reset()` preserves bound native and
kit values when the reset handler prevents default. A trusted reset-button click
under pinned Svelte 5.57.1 and Chromium instead restores the native text binding
to its default despite the reset event being cancelable and default-prevented;
the raw native Svelte input reproduces this same boundary. The separately guarded
Checkbox/Switch/Radio values remain cancelled. Do not claim universal trusted-click
reset cancellation or add a kit reset engine to conceal the framework behavior.
The combined fixture also avoids naming a button `reset`, which would mask the
native form method through ordinary HTML named-property lookup. S193 independent
review and final AC20 qualification must retain these measured bounds.

Removing all messages removes described-by and clears explicit descriptor refs.
Required marker refs clear when required becomes false. Whole field teardown
clears native and kit refs, and remount restores current state/relationships.
Twelve concurrent requests per layout and all four initial helper/error states
retain correct target sets, unique generated identities and actual hydration.
An owned copied-Root mutation capturing initial descriptions preserves initial
targets but leaves exactly the removed error reference; the same detector proves
that fault. This author qualification remains pending separate S148 acceptance.

## Complete source customization hooks

Preserve all 94 parsed source declarations. The target additionally disables
control border/shadow transitions under prefers-reduced-motion: reduce. This
bounded CSS adaptation retains source default timing and all geometry/state
rules; it adds no state, animation engine or new customization API.

Tokens0.1.9 records the observed field hooks without changing semantic defaults.
All original 228 records remain unchanged; 35 new field records complete 40 hooks. Preserve the five original radius records and all source fallback chains. Surface and control references may use different local fallbacks for the same hook; all source declarations remain exact and the metadata retains the original canonical control chain.

| Property                                 | Grammar                                                                                                             | Source fallback                                                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| --kit-field-gap                          | `<length-percentage>`                                                                                               | `0.5rem`                                                                                                      |
| --kit-field-disabled-opacity             | `<number>`                                                                                                          | `var(--kit-disabled-opacity)`                                                                                 |
| --kit-field-surface-border-width         | `<length-percentage>`                                                                                               | `0`                                                                                                           |
| --kit-field-surface-border-color         | `<color>`                                                                                                           | `transparent`                                                                                                 |
| --kit-field-surface-radius               | `<length-percentage>{1,4} [ / <length-percentage>{1,4} ]? \| inherit \| initial \| unset \| revert \| revert-layer` | `var(--kit-radius-surface, var(--kit-radius-default, var(--kit-field-control-radius, var(--kit-radius-md))))` |
| --kit-field-control-radius               | `<length-percentage>{1,4} [ / <length-percentage>{1,4} ]? \| inherit \| initial \| unset \| revert \| revert-layer` | `var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md)))`                                  |
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
| --kit-input-radius                       | `<length-percentage>{1,4} [ / <length-percentage>{1,4} ]? \| inherit \| initial \| unset \| revert \| revert-layer` | `var(--kit-field-control-radius, var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md))))` |
| --kit-select-radius                      | `<length-percentage>{1,4} [ / <length-percentage>{1,4} ]? \| inherit \| initial \| unset \| revert \| revert-layer` | `var(--kit-field-control-radius, var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md))))` |
| --kit-textarea-radius                    | `<length-percentage>{1,4} [ / <length-percentage>{1,4} ]? \| inherit \| initial \| unset \| revert \| revert-layer` | `var(--kit-field-control-radius, var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md))))` |
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
