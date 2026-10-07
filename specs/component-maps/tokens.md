# Portable tokens and customization mapping

The semantic and component-customization contracts are independently versioned
v1 documents using the adopted target schemas. This is a design vocabulary
mapping; token CSS installation and generated integration metadata follow at
S093/S094, and computed browser behavior follows at S095.

Source: [immutable semantic contract](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/contracts/theme-v1.json)
and [immutable customization contract](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/contracts/component-customization-v1.json).
Source framework/schema/ABI identities are excluded; tool, item and target
contract versions remain independent. Derived assets retain Copyright (c)2026
Tyson Lupul and the full [MIT notice](../../LICENSE-MIT); the source is licensed
MIT OR Apache-2.0, and this mapping uses the MIT option.

## Semantic defaults

Every source semantic token is mapped exactly, with unchanged default bytes.
Roles distinguish text/surface/border/focus from general color, while geometry,
shadow, motion/easing and opacity retain their own intended meanings. The
required source properties remain supplied by the foundation. No palette, reset,
application selector or automatic contrast certification is invented.

| Property                         | Target role | Value type | Reference default               |
| -------------------------------- | ----------- | ---------- | ------------------------------- |
| --kit-color-canvas               | surface     | color      | #f8fafc                         |
| --kit-color-surface              | surface     | color      | #ffffff                         |
| --kit-color-surface-raised       | surface     | color      | #ffffff                         |
| --kit-color-surface-hover        | surface     | color      | #f3f4f6                         |
| --kit-color-surface-active       | surface     | color      | #e5e7eb                         |
| --kit-color-text                 | text        | color      | #111827                         |
| --kit-color-text-secondary       | text        | color      | #374151                         |
| --kit-color-text-muted           | text        | color      | #4b5563                         |
| --kit-color-border               | border      | color      | #d1d5db                         |
| --kit-color-border-strong        | border      | color      | #9ca3af                         |
| --kit-color-primary              | color       | color      | #111827                         |
| --kit-color-primary-hover        | color       | color      | #1f2937                         |
| --kit-color-primary-foreground   | color       | color      | #ffffff                         |
| --kit-color-selection-indicator  | color       | color      | #ffffff                         |
| --kit-color-secondary            | color       | color      | #ffffff                         |
| --kit-color-secondary-hover      | color       | color      | #f3f4f6                         |
| --kit-color-secondary-foreground | color       | color      | #111827                         |
| --kit-color-accent               | color       | color      | #2563eb                         |
| --kit-color-accent-hover         | color       | color      | #1d4ed8                         |
| --kit-color-accent-foreground    | color       | color      | #ffffff                         |
| --kit-color-info                 | color       | color      | #0284c7                         |
| --kit-color-info-foreground      | color       | color      | #ffffff                         |
| --kit-color-success              | color       | color      | #16a34a                         |
| --kit-color-success-foreground   | color       | color      | #ffffff                         |
| --kit-color-warning              | color       | color      | #d97706                         |
| --kit-color-warning-foreground   | color       | color      | #111827                         |
| --kit-color-danger               | color       | color      | #dc2626                         |
| --kit-color-danger-hover         | color       | color      | #b91c1c                         |
| --kit-color-danger-foreground    | color       | color      | #ffffff                         |
| --kit-color-link                 | color       | color      | #111827                         |
| --kit-color-link-hover           | color       | color      | #111827                         |
| --kit-focus-ring                 | focus       | color      | #2563eb                         |
| --kit-radius-sm                  | radius      | length     | 0.25rem                         |
| --kit-radius-md                  | radius      | length     | 0.375rem                        |
| --kit-radius-lg                  | radius      | length     | 0.5rem                          |
| --kit-radius-full                | radius      | length     | 999px                           |
| --kit-border-width               | border      | length     | 1px                             |
| --kit-shadow-sm                  | shadow      | shadow     | 0 1px 2px rgb(15 23 42 / 8%)    |
| --kit-shadow-md                  | shadow      | shadow     | 0 12px 28px rgb(15 23 42 / 14%) |
| --kit-shadow-lg                  | shadow      | shadow     | 0 20px 40px rgb(15 23 42 / 18%) |
| --kit-duration-fast              | motion      | duration   | 120ms                           |
| --kit-duration-normal            | motion      | duration   | 140ms                           |
| --kit-easing-standard            | easing      | string     | cubic-bezier(0.2, 0, 0, 1)      |
| --kit-disabled-opacity           | opacity     | number     | 0.55                            |

## Radius roles and exact component overrides

The following ordered chains preserve the source relationships. Scope is the
source semantic scope or named component owner. The target schema intentionally
carries only name/scope/grammar/fallback; role and geometry-critical source
semantics are explicitly retained here rather than inserted as unknown fields.
Unset component properties follow semantic role, default and reference radius.
Geometry-critical avatar/radio/spinner/switch-thumb shapes bypass broad semantic
radius overrides and change only through their exact property. The menu item's
natural fallback remains its source calculation.

| Property                         | Scope       | Source role       | Geometry critical | Ordered fallback expression                                                                                   |
| -------------------------------- | ----------- | ----------------- | ----------------- | ------------------------------------------------------------------------------------------------------------- |
| --kit-radius-default             | semantic    | default           | no                | `var(--kit-radius-md)`                                                                                        |
| --kit-radius-control             | semantic    | control           | no                | `var(--kit-radius-default, var(--kit-radius-md))`                                                             |
| --kit-radius-surface             | semantic    | surface           | no                | `var(--kit-radius-default, var(--kit-radius-lg))`                                                             |
| --kit-radius-overlay             | semantic    | overlay           | no                | `var(--kit-radius-default, var(--kit-radius-md))`                                                             |
| --kit-radius-indicator           | semantic    | indicator         | no                | `var(--kit-radius-default, var(--kit-radius-full))`                                                           |
| --kit-alert-radius               | alert       | surface           | no                | `var(--kit-radius-surface, var(--kit-radius-default, var(--kit-radius-md)))`                                  |
| --kit-avatar-radius              | avatar      | geometry-critical | yes               | `var(--kit-radius-full)`                                                                                      |
| --kit-badge-radius               | badge       | indicator         | no                | `var(--kit-radius-indicator, var(--kit-radius-default, var(--kit-radius-full)))`                              |
| --kit-button-radius              | button      | control           | no                | `var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md)))`                                  |
| --kit-card-radius                | card        | surface           | no                | `var(--kit-radius-surface, var(--kit-radius-default, var(--kit-radius-lg)))`                                  |
| --kit-checkbox-radius            | checkbox    | control           | no                | `var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-sm)))`                                  |
| --kit-collapsible-trigger-radius | collapsible | control           | no                | `var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md)))`                                  |
| --kit-dialog-trigger-radius      | dialog      | control           | no                | `var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md)))`                                  |
| --kit-dialog-close-radius        | dialog      | control           | no                | `var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md)))`                                  |
| --kit-dialog-radius              | dialog      | overlay           | no                | `var(--kit-radius-overlay, var(--kit-radius-default, var(--kit-radius-md)))`                                  |
| --kit-field-surface-radius       | field       | surface           | no                | `var(--kit-radius-surface, var(--kit-radius-default, var(--kit-field-control-radius, var(--kit-radius-md))))` |
| --kit-field-control-radius       | field       | control           | no                | `var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md)))`                                  |
| --kit-input-radius               | field       | control           | no                | `var(--kit-field-control-radius, var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md))))` |
| --kit-select-radius              | field       | control           | no                | `var(--kit-field-control-radius, var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md))))` |
| --kit-textarea-radius            | field       | control           | no                | `var(--kit-field-control-radius, var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md))))` |
| --kit-menu-trigger-radius        | menu        | control           | no                | `var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md)))`                                  |
| --kit-menu-content-radius        | menu        | overlay           | no                | `var(--kit-radius-overlay, var(--kit-radius-default, var(--kit-radius-md)))`                                  |
| --kit-menu-item-radius           | menu        | control           | no                | `var(--kit-radius-control, var(--kit-radius-default, calc(var(--kit-radius-md) - 2px)))`                      |
| --kit-progress-radius            | progress    | indicator         | no                | `var(--kit-radius-indicator, var(--kit-radius-default, var(--kit-radius-full)))`                              |
| --kit-radio-radius               | radio       | geometry-critical | yes               | `var(--kit-radius-full)`                                                                                      |
| --kit-skeleton-radius            | skeleton    | surface           | no                | `var(--kit-radius-surface, var(--kit-radius-default, var(--kit-radius-sm)))`                                  |
| --kit-spinner-radius             | spinner     | geometry-critical | yes               | `var(--kit-radius-full)`                                                                                      |
| --kit-switch-radius              | switch      | indicator         | no                | `var(--kit-radius-indicator, var(--kit-radius-default, var(--kit-radius-full)))`                              |
| --kit-switch-thumb-radius        | switch      | geometry-critical | yes               | `var(--kit-radius-full)`                                                                                      |
| --kit-tabs-trigger-radius        | tabs        | control           | no                | `var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md)))`                                  |

Every radius property accepts the complete border-radius grammar: one to four
length/percentage corners with optional slash-separated elliptical radii,
calculated values, CSS variables and CSS-wide keywords. No restrictive @property
registration or scalar-only schema is used. Invalid custom values use ordinary
computed-value behavior; this document does not claim browser qualification.

Runtime non-radius customization hooks are mapped and qualified with their
scheduled component families from actual source CSS. Semantic defaults and
component properties remain distinct. Application-owned themes load after kit
CSS and own color-scheme, selectors and persistence. Body-portaled content needs
a document-level theme scope or a suitable custom host; no hidden theme store
or inline computed-theme copy is introduced.
