# Checkbox source and pinned primitive contract

Current qualification status: original family gates through S193 are independently
accepted. Checkpoint-era pending/gated statements below retain historical
provenance. The selected native baseline and final release remain candidates
under [current qualification](../../implementation/evidence/COMPATIBILITY.md#current-native-and-source-boundaries)
and the sole governing ledger; separate S203 acceptance remains required.

Source: [native control](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/ui/checkbox.rs),
[manifest](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/ui/checkbox.json) and
[design CSS](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/styles/checkbox.css).
Preserve MIT attribution and the source's controlled boolean checked, disabled,
name, callback intent and fixed 16-by-16 SVG checkmark. Adapt Rust callbacks to
actual Svelte/Bits contracts rather than exposing compatibility aliases.

The exact flat exports are Checkbox and CheckboxProps. The source is a simple
single control, not a group or a public indicator family. CheckboxProps aliases
Omit<BitsCheckbox.RootProps, "child" | "children"> from pinned Bits UI2.19.5-svelte-ui-kit.2.
The separate exported type file lets generated consumers import the same exact
contract and type fixtures audit it before the Svelte implementation exists.
Root owns one decorative SVG; child/children are excluded, never accepted and
dropped. No Group, GroupLabel, public Indicator, indicatorProps, variant,
checked-string union, Rust on_change or selection store is introduced.

| Surface                    | Exact policy                                                                                       |
| -------------------------- | -------------------------------------------------------------------------------------------------- |
| checked                    | Bindable boolean, default false; onCheckedChange receives boolean                                  |
| indeterminate              | Separate bindable boolean, default false; onIndeterminateChange receives boolean                   |
| ref                        | Bindable actual native HTMLElement/null; default element is a button                               |
| disabled/required/readonly | Exact primitive types and event refusal; required also reaches the real form field                 |
| name/value/form            | Exact pinned types; value defaults on; one actual named checkbox field                             |
| attributes/events          | Native button, aria/data, id, class and primitive style forwarded; no generic widening             |
| type                       | Native default button, preserving explicit primitive submit/reset opt-ins                          |
| labels                     | Visible consuming label associates by Root id; native role checkbox, aria-checked false/true/mixed |

Pinned Root consumes form for its field and does not emit form on its default
button; the wrapper preserves this native policy, with association on the one
actual input. Readonly Space can still synthesize a native click reaching caller
events, while primitive checked state remains unchanged; direct native controls
qualify that event ordering.

The primitive toggles a mixed state to checked and clears indeterminate; it owns
Space/pointer ordering and cancellation. Checked and indeterminate remain
independent booleans, not an invented tri-state checked value. Root callbacks
and native events are forwarded unchanged. No wrapper keyboard/state engine or
module-global identity is permitted.

## Native form participation and lifecycle

The pinned primitive's HiddenInput forwards checked but has no native reset
bridge or indeterminate property synchronization. Its actual checkbox has
required/disabled/name/value/form but reset can leave the Root state stale.
As already qualified for Switch, withhold only name/value from Root and emit
one native offscreen checkbox sharing checked and actual form attributes.
Do not retain the primitive named input or introduce duplicate successful fields.
Synchronize this input's actual indeterminate property with the bound state.
Capture initial checked per instance; native defaultChecked uses that initial
checked value. A direct native Chromium control proves form reset preserves the
current indeterminate property; do not restore an initial mixed value. A tree-local reset capture resolves input.form
at event time, settles after cancellation and restores checked only for an
uncanceled reset of its current owner, preserving current indeterminate. Reassociation/replacement of an
external form must remain native. Input destruction removes the reset listener
and every pending timer. Unnamed controls emit no form field. Exact empty-name,
required/disabled, checked/unchecked/mixed values, canceled/reset/reassociation
and dynamic teardown are owning S130/S131 installed-consumer proof obligations.

## Source design mapping

The fixed outer span kit-checkbox-root preserves inline-grid and 1rem by1rem
geometry. Root's actual button uses kit-checkbox with caller classes and the
source border/surface/radius; the adjacent owned SVG uses kit-checkbox-indicator,
viewBox0 0 16 16, aria-hidden true and focusable false. Its unchanged check path
is M3.25 8.25 6.5 11.5 12.75 4.75. Checked+disabled appearance, focus ring,
cursor, selection background and selection-indicator stroke retain source tokens.
Map input :checked onto the primitive data-state checked; disabled remains the
actual native button selector. Mixed uses the same selected surface with a
fixed noninteractive horizontal mark in the same viewBox. Both indicators keep
1rem geometry; no application text or font glyph determines their dimensions.
The offscreen form field has a separate kit-checkbox-input class and never
intercepts pointer or keyboard input.

The one existing --kit-checkbox-radius source customization entry remains
unchanged: component then var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-sm))) fallbacks. Semantic token
values and original customization records stay intact. Managed plain CSS lives
in one checkbox component block with tokens as the only registry dependency;
Bits UI2.19.5-svelte-ui-kit.2 is the explicit npm dependency. S130 advertises only the complete
source/type/style/export cohort and generates default/custom real consumers.
S131 qualifies forms, labels, refs/callbacks, state, fixed indicator geometry,
caller classes/events, theme/RTL/focus, SSR/hydration and teardown against actual
compiled installed output. This API freeze is not independent behavioral or
release acceptance; the separate original S148 gate remains required.
