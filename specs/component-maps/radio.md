# Radio source, selection and native form contract

Current qualification status: original family gates, the selected native
baseline and local MVP are independently accepted through S203.
[Final qualification](../../implementation/evidence/RCLD-11_QUALIFICATION.md)
is anchored at `f756d227b6a1dce1396183dec4db138a256e16bf`. Checkpoint-era pending/gated statements below
retain historical provenance and do not reopen completed gates.
[Native/source boundaries](../../implementation/evidence/COMPATIBILITY.md#current-native-and-source-boundaries)
and documented platform limits remain explicit.

Source: [component](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/ui/radio.rs),
[manifest](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/ui/radio.json) and
[CSS](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/styles/radio.css).
Preserve MIT attribution. The source's named native radio, controlled checked,
string value/change callback, disabled refusal and circular selected design map
to actual pinned Bits RadioGroup2.19.5-svelte-ui-kit.2, with stable string values rather than a
second selection engine. Consume a fieldset/legend or a visible group label and
label each item; source on_change is expressed through native onValueChange.

Exactly RadioGroup/RadioGroupProps and RadioItem/RadioItemProps are public flat
exports. Group aliases the pinned public RootProps; Item aliases ItemProps.
Group binds actual value (empty string default) and HTMLElement/null ref. Item
requires string value and binds actual HTMLElement/null ref, normally a button.
Group owns native radiogroup/name/required/disabled/readonly, vertical/horizontal
orientation and loop=true. Native dir, classes/style, IDs, aria/data, handlers,
value callback and actual refs remain forwarded; no numeric index, boolean checked,
array selection, invented orientation or compatibility alias is added.

Group children is a no-argument snippet; its child receives actual native props.
Item children receives checked; its child receives props and checked. Both forms
are preserved rather than swallowed. External visible labels associate with
actual Item id; aria-labelledby or aria-label names the Group. The wrapper does
not manufacture a legend, label string or description registration engine.
Pointer/programmatic focus, keyboard navigation/Space, disabled refusal,
readonly navigation and focus/tabstop management remain native. Values stay
controlled through bind:value or uncontrolled initial value with onValueChange.

## Form participation and lifecycle

Pinned Group supports name/required/disabled with one offscreen value field in
its containing form. Group has no form prop; do not add an external-form alias.
Item's native button form attribute does not associate the Group field. Its
primitive always renders type button. Selection does not make every Item an
independent named input; no duplicated successful fields are allowed. Named
Group submission uses its actual string value, including empty/unmatched native
values, and Group disabled omits the field. Item disabled refuses activation;
Group value remains the primitive's authoritative selection when choices change.

The actual pinned field defaults to text, receives required/disabled/name/value,
and focuses the native current tabstop on validation focus. A direct S133 raw
primitive control reproduces reset clearing the field while Group still selects
the old value. Withhold name only from the primitive and emit one native
offscreen text field, preserving its existing successful-value/required policy.
Capture per-instance initial value/defaultValue and resolve input.form at each
reset. Settle only after native cancellation, restore the bound initial value
for uncanceled current-owner resets and emit no duplicate named field. Actual
S133 candidate reset proof and original S135 installed qualification are required.
The native current tabstop can receive field focus using its actual rendered
item/tabindex; no roving-focus algorithm or new context is justified. Cleanup
must remove the actual reset listener and pending timers. Unnamed groups remain
outside form submission, and original S135 qualifies required, disabled, checked
selection, submission, canceled/reset, dynamic choices/refs and SSR/hydration.
S135 qualifies those obligations in actual default/custom CLI installations.
Native empty-value arrow navigation moves focus without selecting: the installed
wrapper and a direct raw Bits control both retain empty value until Space/click.
For a nonempty value, arrows/Home/End select the focused enabled item; native
loop, orientation, RTL and readonly rules remain intact. Clearing the value
retains the current native tabstop, including required-field validation focus.
Removing a selected choice retains its string value until caller/native selection
changes it; no normalization or alternative keyboard engine is added.
Actual same-ID form replacement resolves the current input owner on reset.
Destroying during reset cancels its queued timer and removes the listener; an
owned installed copy with both cleanup statements removed demonstrably changes
destroyed bound state and leaks an extra listener after remount. Concurrent
same-worker SSR and hydration preserve request-local selected values and one
named field. These are locally verified candidate observations; separate S148
acceptance remains mandatory.

## Source design and exact inventory

RadioGroup uses kit-radio-group on its actual div; RadioItem uses source class
kit-radio on its actual button and merges caller classes. The source indicator
is radial-gradient paint on that fixed 1rem by1rem Item, not another public part.
Native Bits has no Indicator component and source has no indicator export.
Do not invent RadioIndicator, public circle children or label/indicator hooks.
Preserve the source 28% selected mark with a 30% transparent edge, semantic
selection-indicator/primary/surface/border colors, border width, focus ring,
disabled opacity and cursor. Map :checked onto native data-state=checked.
Button padding/box-sizing may normalize the browser element to original geometry.
The exact --kit-radio-radius fallback remains var(--kit-radius-full), independent
of broad control/default overrides; explicit component radius still wins.
No additional token/palette/radius metadata or design variant is needed.

The complete family is five assets: four sources (group.svelte, item.svelte,
types.ts and index.ts under radio), plus one managed styles/radio.css asset.
The generated value/type export cohort has tokens as its only registry dependency
and Bits UI2.19.5-svelte-ui-kit.2 as its explicit npm runtime dependency. Candidate wrappers
remain unadvertised through S133; S134 installs only the complete family; S135
qualifies actual generated keyboard/forms/geometry. Required separate original
S148 acceptance gates S149; this freeze is implementation evidence only.
