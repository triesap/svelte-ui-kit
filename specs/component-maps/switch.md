# Switch source and pinned primitive contract

Source: [component](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/ui/switch.rs)
and [stylesheet](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/styles/switch.css).
Retain package MIT attribution. Source design selectors and callback intent
are adapted to native Svelte/Bits behavior, not Rust identities or shims.

Public Switch and SwitchProps wrap Bits UI 2.19.3 Switch.Root with one
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

Bits renders a HiddenInput when name is provided and checked determines its
form contribution. Required, disabled, value and reset behavior must be tested
against that actual input at S104; a visible role-switch alone does not qualify
forms. Preserve upstream value typing rather than introducing an authored any
workaround. Upstream declaration exceptions remain exact recorded AC20 debt.

CSS adapts the full source Root/Thumb selectors into a managed switch block in
the components layer. Checked track/Thumb data-state styling, focus-visible,
disabled appearance, RTL negative translation and reduced-motion transition
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
