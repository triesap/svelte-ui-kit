# Spinner mapping and native contract

Source: [immutable component](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/ui/spinner.rs)
and [immutable stylesheet](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/styles/spinner.css).
Derived design/API mapping retains Copyright (c)2026 Tyson Lupul under the
[MIT option](../../LICENSE-MIT). Framework implementation and identity ABI are
not copied into the target runtime.

## Public types and ownership

The native component exports `Spinner`, `SpinnerMode` and `SpinnerProps`.
`SpinnerMode` is the string union `status | decorative`, corresponding to the
two source modes. Default mode is status and default label is Loading. Status
owns one visually hidden label and role=status; the mark is aria-hidden.
Decorative owns no status role, label, live region or announcement, and its outer
span is aria-hidden. Button loading will use this mode and own its own text.

Pinned Svelte5.57.1 provides the exact native type
`SvelteHTMLElements["span"]`. The source's class extension maps to ordinary native
caller classes; preserve id, style, data attributes, events and other native
attributes. There is no internal event handler to merge. The discriminated
props exclude label in decorative mode, internal children, and controlled
role/aria-hidden/aria-label/aria-live. Unlike the source's ignored decorative
label argument, the target refuses that combination at the type boundary;
this implements the adopted owned-markup rule rather than accepting a hook
and silently dropping it. No polymorphism, child delegation, bindable ref,
identity helper, form value or new mode is supported. Span has no native form
submission or focus behavior; the component must not create a tab stop.

The standalone type template is justified because both public types are
generated sibling exports and shared by the real wrapper and typed consumers.
No dummy runtime implementation or primitive dependency is introduced. Spinner
has a direct tokens registry dependency and no required npm dependency.
Registration and real runtime render proof are S097; lifecycle/browser proof
is S098. Type checks do not claim runtime completion.

## CSS and accessibility coupling

Retain kit-spinner, kit-spinner-mark and kit-spinner-label selectors in the
components layer. Own the base class without removing caller classes. Keep
the source's visible ring/track, inherited currentColor, clipped label and
rotation vocabulary. Circular geometry uses only the exact spinner radius
override and reference full radius; broad role/default radius overrides must
not turn the mark into a rounded rectangle. Full radius grammar is preserved.

| Property                         | Default/fallback                                  | Purpose                           |
| -------------------------------- | ------------------------------------------------- | --------------------------------- |
| --kit-spinner-inline-size        | 1em                                               | Outer inline size                 |
| --kit-spinner-block-size         | 1em                                               | Outer block size                  |
| --kit-spinner-border-width       | 0.125em                                           | Ring thickness                    |
| --kit-spinner-track-color        | color-mix(in srgb, currentColor 20%, transparent) | Ring track                        |
| --kit-spinner-color              | currentColor                                      | Leading ring color                |
| --kit-spinner-radius             | var(--kit-radius-full)                            | Geometry-critical complete radius |
| --kit-spinner-animation-duration | 900ms                                             | Rotation duration                 |

The source animates continuously; the adopted target reduced-motion requirement
adds a reduce preference that stops rotation while retaining the visible mark.
Native status semantics retain their implicit polite announcement; no redundant
explicit live region is added. Status callers must supply meaningful labels.
Decorative use never duplicates the owning control's loading text. No blanket
contrast claim follows from inherited color or the default track formula.
