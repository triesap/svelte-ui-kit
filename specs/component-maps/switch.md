# Switch source and pinned primitive contract

Current qualification status: original family gates, the selected native
baseline and local MVP are independently accepted through S203.
[Final qualification](../../implementation/evidence/RCLD-11_QUALIFICATION.md)
is anchored at `f756d227b6a1dce1396183dec4db138a256e16bf`. Checkpoint-era pending/gated statements below
retain historical provenance and do not reopen completed gates.
[Native/source boundaries](../../implementation/evidence/COMPATIBILITY.md#current-native-and-source-boundaries)
and documented platform limits remain explicit.

Source: [component](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/ui/switch.rs)
and [stylesheet](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/styles/switch.css).
Retain package MIT attribution. Source design selectors and callback intent
are adapted to native Svelte/Bits behavior, not Rust identities or shims.

Public Switch and SwitchProps wrap Bits UI 2.19.5-svelte-ui-kit.2 Switch.Root with one
Switch.Thumb. SwitchProps is exactly Omit<BitsSwitch.RootProps, "child" |
"children"> from the public bits-ui namespace. No replacement native interface,
generic dictionary or invented callback alias substitutes for the actual type.
Checked and ref are explicitly bindable at S103; ref preserves upstream
HTMLElement/null typing and receives the actual button. OnCheckedChange retains
its boolean callback. Id, native button attributes/events, form, required,
disabled, name/value, caller class and Bits style types remain forwarded.

Child and children are excluded because the wrapper owns its Thumb. There are
no accepted-but-dropped snippets, public Thumb or thumbProps APIs. Root class
combines kit-switch with caller classes; Thumb uses kit-switch-thumb and is
decorative. Bits owns internal event ordering/cancellation through its real
mergeProps implementation. The wrapper adds no custom handler or state machine.
Native default type button, aria-checked, role=switch, data-state checked or
unchecked and disabled come from the actual Root, not duplicated kit markup.

The pinned Root HiddenInput lacks a checked binding/reset bridge. S104's actual
consumer tests reproduced incoherent reset. The target therefore withholds only
name/value from Root and emits exactly one named native Svelte checkbox sharing
checked through native attributes/onchange. Per-instance initialChecked and
native defaultChecked are retained. The pinned framework checked-binding resets
state despite a canceled native event in actual browser probes, so a lifecycle
tree-local capture listener resolves the checkbox's current native form owner
at event time, settles after the full event task and respects defaultPrevented.
Replacing a form with another element of the same ID therefore preserves native
reset behavior without requiring a prop/ref change. It restores only the
per-instance initial checked value and removes listeners/clears pending timers
on field teardown. No global
state or primitive keyboard/event implementation is cloned. Name/value,
required, disabled and external form association are native input attributes;
Root still owns keyboard, checked callbacks, ref and switch semantics. Unnamed
controls create no form input. The field is offscreen via kit-switch-input CSS,
not display:none; there is no native binding/state-machine clone or new API.
Actual form values and resets are tested rather than inferred from role markup.
Preserve upstream value typing rather than introducing an authored any
workaround. Raw strict checking is required with the authenticated native build; final AC20
remains dependent on cumulative qualification and independent acceptance.

CSS adapts the full source Root/Thumb selectors into a managed switch block in
the components layer. Checked track/Thumb data-state styling, focus-visible,
disabled appearance, RTL logical travel and reduced-motion transition
removal remain native computed-style obligations. Thumb uses exact
--kit-switch-thumb-radius then full-radius fallback; broad radius overrides
cannot change its default circular geometry. Track uses the source indicator
radius cascade. Seven source CSS hooks remain inherited at S103:

| Property                                | Source fallback                                                                  |
| --------------------------------------- | -------------------------------------------------------------------------------- |
| --kit-switch-radius                     | `var(--kit-radius-indicator, var(--kit-radius-default, var(--kit-radius-full)))` |
| --kit-switch-thumb-radius               | `var(--kit-radius-full)`                                                         |
| --kit-switch-track-background-unchecked | `var(--kit-color-border-strong)`                                                 |
| --kit-switch-track-background-checked   | `var(--kit-color-primary)`                                                       |
| --kit-switch-thumb-background           | `var(--kit-color-surface)`                                                       |
| --kit-switch-transition-duration        | `var(--kit-duration-fast)`                                                       |
| --kit-switch-transition-timing          | `var(--kit-easing-standard)`                                                     |

Registry dependency tokens and npm runtime dependency bits-ui are explicit;
no styled kit helper, runtime auto-install, global state or root barrel import
is required. S103 proves generated source/initial SSR and S104 proves actual
state bindings, callbacks, forms/reset/required/disabled, refs, RTL and motion.

The actual production CSS compiler lowers :dir(rtl) into language selectors.
Thumb travel is adapted to margin-inline-start with the same 0.875rem distance
and duration/easing hooks, so direction changes work without config changes.
Original dimensions, track colors, radius, disabled/focus and reduced-motion
semantics remain. S104 qualifies physical relative travel in both directions.
