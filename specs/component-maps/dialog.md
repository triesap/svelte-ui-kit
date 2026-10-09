# Dialog source and exact compound contract

Source family: [parts](https://github.com/triesap/leptos_ui_kit/tree/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/ui/dialog)
and [stylesheet](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/styles/dialog.css).
Retain package MIT attribution. Target layout follows GENERATED_LAYOUT.md;
there is one flat naming surface, no parallel Dialog.Root kit namespace.

| Public value      | Public type            | Pinned Bits UI 2.19.5-svelte-ui-kit.2 type | Owned design class       |
| ----------------- | ---------------------- | ------------------------------------------ | ------------------------ |
| DialogRoot        | DialogRootProps        | Dialog.RootProps                           | none: no DOM node        |
| DialogTrigger     | DialogTriggerProps     | Dialog.TriggerProps                        | kit-dialog-trigger       |
| DialogPortal      | DialogPortalProps      | Dialog.PortalProps                         | none: portal composition |
| DialogOverlay     | DialogOverlayProps     | Dialog.OverlayProps                        | kit-dialog-overlay       |
| DialogContent     | DialogContentProps     | Dialog.ContentProps                        | kit-dialog-content       |
| DialogTitle       | DialogTitleProps       | Dialog.TitleProps                          | kit-dialog-title         |
| DialogDescription | DialogDescriptionProps | Dialog.DescriptionProps                    | kit-dialog-description   |
| DialogClose       | DialogCloseProps       | Dialog.CloseProps                          | kit-dialog-close         |

Every type aliases the public pinned primitive type directly. Root open is
explicitly bindable, with false default and actual boolean onOpenChange and
onOpenChangeComplete callbacks. Root forwards its no-argument children snippet;
it has no DOM/ref/class or invented modal prop. DOM parts bind upstream
HTMLElement/null ref, forward native attributes/events/styles and combine caller
classes with the exact design class. No wrapper handler, focus trap, dismissal
stack, identity shim or mutable module-level state is introduced.

Trigger/Title/Description/Close support the exact child({props}) and default
children snippet paths. Overlay child receives {props, open}, while default
children receives {open}. Content child receives {props, open}; default children
is a no-argument snippet. Those shapes are preserved without manufacturing
floating wrapperProps (Dialog Content is not a floating positioned Menu).
Delegated markup must apply the supplied props and preserve primitive semantics.
Native button activation/default type and native ref live in the actual pinned
Trigger/Close; headings and title/description IDs are owned by the primitive.
Title defaults heading level2, matching the source. Missing description never
manufactures a label relationship. Accessible content requires a real Title or
an explicit appropriate accessible name; labels are verified in actual DOM.

Portal to is Element|string with default document.body; disabled renders inline.
No target alias, host selector guessing, browser global at module scope or copied
computed theme variables are added. Application theme must reach the selected
portal target through CSS inheritance. Custom target and inline choices remain
explicit upstream composition, and open-overlay theme changes are S114 coverage.

Content preserves forceMount, trapFocus, preventScroll, restoreScrollDelay,
preventOverflowTextSelection, onOpenAutoFocus/onCloseAutoFocus,
onEscapeKeydown/onInteractOutside and their cancellation semantics. Bits assigns
dialog semantics and owns presence, focus looping, Escape/outside dismissal and
scroll behavior. Generic inherited native role attributes are not a kit
DialogContentRole API or a change of primitive kind. Separate Alert Dialog uses
the actual distinct primitive in the next sequence; no role-based emulation.
Pure authored CSS does not promise zero primitive inline styles; S113/S114 and
later CSP/platform checks qualify the actual behavior and limitations.

Actual optional Description removal exposes a pinned stale native description
ID. Content keeps a lifecycle-local physical relation guard: use only IDs already
supplied by the primitive, expose references only while real nodes exist, retain
native intent while absent and restore it when they return. Native ID changes
remain authoritative. Lookup and mutation observation use Content's actual
Document or ShadowRoot, including supported native Element portal targets. This
physical-reference proof does not add capabilities beyond the native portal.
The observer belongs to the actual bound Content ref and
disconnects on ref replacement/teardown. It creates no IDs, context or focus/state
machinery and accesses browser facilities only inside the lifecycle effect.

All eight sources, types, managed compound exports and one dialog style block
form a single dialog compatibility cohort. Candidate assets remain unregistered
until S111: view/add must not install a partially authored family. S106–S109
candidate fixtures use each completed wrapper with explicitly remaining raw Bits
parts. Tokens and bits-ui are the required source/runtime dependencies; no
Button/Spinner or styled runtime dependency is inferred merely for styling.

## Actual managed CSS mapping

The immutable source has no painted Overlay. The explicit Overlay is transparent
and fills the viewport at the existing dialog stacking level. Application classes
may style it; no new palette or backdrop prop is introduced. Native closed and
starting-style attributes share the source exit appearance. Reduced motion removes
Content/Overlay transitions. Logical inset-inline0/margin-inline:auto with translateY
preserves centered Content geometry in both directions without a :dir selector.

All source declarations remain except the documented centering transform/inset
adaptation. The portable source CSS declaration inventory is retained in the
candidate fixture. Title/Description/Trigger/Close rules target their actual owned
classes; no global raw-Bits selector or Tailwind is used. Existing three radius
hooks retain their complete grammar and source fallbacks. The following45 source
hooks are carried by the portable v1 component contract; semantic defaults stay
unchanged.

| Property                              | Source fallback                                                              |
| ------------------------------------- | ---------------------------------------------------------------------------- |
| --kit-dialog-background               | `var(--kit-color-surface-raised)`                                            |
| --kit-dialog-border-color             | `var(--kit-color-border)`                                                    |
| --kit-dialog-border-width             | `var(--kit-border-width)`                                                    |
| --kit-dialog-close-background         | `transparent`                                                                |
| --kit-dialog-close-background-hover   | `var(--kit-color-surface-hover)`                                             |
| --kit-dialog-close-border-color       | `var(--kit-color-border)`                                                    |
| --kit-dialog-close-color              | `var(--kit-color-text)`                                                      |
| --kit-dialog-close-disabled-opacity   | `var(--kit-disabled-opacity)`                                                |
| --kit-dialog-close-focus-ring         | `var(--kit-dialog-focus-ring, var(--kit-focus-ring))`                        |
| --kit-dialog-close-font-weight        | `600`                                                                        |
| --kit-dialog-close-min-height         | `2.5rem`                                                                     |
| --kit-dialog-close-padding-block      | `0.5rem`                                                                     |
| --kit-dialog-close-padding-inline     | `0.75rem`                                                                    |
| --kit-dialog-close-radius             | `var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md)))` |
| --kit-dialog-color                    | `var(--kit-color-text)`                                                      |
| --kit-dialog-description-color        | `var(--kit-color-text-muted)`                                                |
| --kit-dialog-description-font-size    | `0.9375rem`                                                                  |
| --kit-dialog-description-line-height  | `1.5`                                                                        |
| --kit-dialog-elevation                | `var(--kit-shadow-lg)`                                                       |
| --kit-dialog-focus-outline-offset     | `2px`                                                                        |
| --kit-dialog-focus-outline-width      | `2px`                                                                        |
| --kit-dialog-focus-ring               | `var(--kit-focus-ring)`                                                      |
| --kit-dialog-gap                      | `1rem`                                                                       |
| --kit-dialog-max-block-size           | `min(42rem, calc(100vh - 2rem))`                                             |
| --kit-dialog-max-inline-size          | `min(32rem, calc(100vw - 2rem))`                                             |
| --kit-dialog-padding-block            | `1.25rem`                                                                    |
| --kit-dialog-padding-inline           | `1.25rem`                                                                    |
| --kit-dialog-radius                   | `var(--kit-radius-overlay, var(--kit-radius-default, var(--kit-radius-md)))` |
| --kit-dialog-title-font-size          | `1.125rem`                                                                   |
| --kit-dialog-title-font-weight        | `700`                                                                        |
| --kit-dialog-title-line-height        | `1.25`                                                                       |
| --kit-dialog-transition-duration      | `var(--kit-duration-normal)`                                                 |
| --kit-dialog-transition-timing        | `var(--kit-easing-standard)`                                                 |
| --kit-dialog-trigger-background       | `transparent`                                                                |
| --kit-dialog-trigger-background-hover | `var(--kit-color-surface-hover)`                                             |
| --kit-dialog-trigger-border-color     | `var(--kit-color-border)`                                                    |
| --kit-dialog-trigger-color            | `var(--kit-color-text)`                                                      |
| --kit-dialog-trigger-disabled-opacity | `var(--kit-disabled-opacity)`                                                |
| --kit-dialog-trigger-focus-ring       | `var(--kit-dialog-focus-ring, var(--kit-focus-ring))`                        |
| --kit-dialog-trigger-font-weight      | `600`                                                                        |
| --kit-dialog-trigger-min-height       | `2.5rem`                                                                     |
| --kit-dialog-trigger-padding-block    | `0.5rem`                                                                     |
| --kit-dialog-trigger-padding-inline   | `0.75rem`                                                                    |
| --kit-dialog-trigger-radius           | `var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md)))` |
| --kit-dialog-z-index                  | `50`                                                                         |
