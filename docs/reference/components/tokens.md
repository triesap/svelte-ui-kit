# Tokens

Portable semantic design defaults in plain CSS.

## Install and compose

Installation ID: `tokens`. Explicit requests and dependency closure remain separate.

This foundation installs CSS and contracts through init/item dependency closure. There is no `Tokens` import.

## Public contract

The CSS-only foundation installs semantic theme defaults and independent component-customization metadata.
It has no Svelte component, value/type exports, palette reset, selector store or automatic accessibility certification.
Semantic role/type/default rows below are exact source observations; component hooks remain distinct and versioned independently.
App-owned themes load after kit CSS and own color-scheme, selectors and persistence.
Body portals need document-level theme scope or explicit suitable hosts.
Complete radius grammar permits multi-corner/elliptical lengths, percentages, calc/var and CSS-wide keywords without restrictive @property.
Geometry-critical avatar/radio/spinner/switch-thumb shapes bypass broad radius roles.
A defined invalid radius computes to 0px rather than activating var fallback; absence or root initial/unset restores fallback.
Measured source info/success text pairs are below 4.5:1, and every component/state/custom theme requires its own assessment.
Distinct Alert Dialog hooks are target-native additions rather than an original source family.
Maintained consumer projections are byte-exact and checked before fixture/browser use.

## Exports and installed assets

The [authoritative manifest](../../../registry/foundation/tokens.json) owns this inventory.

| Export | Kind     | Local target      |
| ------ | -------- | ----------------- |
| None   | CSS-only | No runtime export |

Registry dependencies: none.
Npm requirements: none.

- [Managed tokens CSS](../../../registry/styles/tokens.css)

The original foundation is CSS-only and has no runtime exports or target aliases.

## Source styling and fallback contracts

The original design source is licensed MIT OR Apache-2.0; this mapping uses the
MIT option and retains Copyright (c) 2026 Tyson Lupul and the full
[MIT notice](../../../LICENSE-MIT). Preserve the distribution's
[source notices](../../../NOTICE.md) when copying generated assets.

These source observations retain exact fallback order. Application overrides and semantic defaults are distinct.

| Property                          | Target role  | Value type        | Reference default               |
| --------------------------------- | ------------ | ----------------- | ------------------------------- |
| --kit-color-canvas                | surface      | color             | #f8fafc                         |
| --kit-color-surface               | surface      | color             | #ffffff                         |
| --kit-color-surface-raised        | surface      | color             | #ffffff                         |
| --kit-color-surface-hover         | surface      | color             | #f3f4f6                         |
| --kit-color-surface-active        | surface      | color             | #e5e7eb                         |
| --kit-color-text                  | text         | color             | #111827                         |
| --kit-color-text-secondary        | text         | color             | #374151                         |
| --kit-color-text-muted            | text         | color             | #4b5563                         |
| --kit-color-border                | border       | color             | #d1d5db                         |
| --kit-color-border-strong         | border       | color             | #9ca3af                         |
| --kit-color-primary               | color        | color             | #111827                         |
| --kit-color-primary-hover         | color        | color             | #1f2937                         |
| --kit-color-primary-foreground    | color        | color             | #ffffff                         |
| --kit-color-selection-indicator   | color        | color             | #ffffff                         |
| --kit-color-secondary             | color        | color             | #ffffff                         |
| --kit-color-secondary-hover       | color        | color             | #f3f4f6                         |
| --kit-color-secondary-foreground  | color        | color             | #111827                         |
| --kit-color-accent                | color        | color             | #2563eb                         |
| --kit-color-accent-hover          | color        | color             | #1d4ed8                         |
| --kit-color-accent-foreground     | color        | color             | #ffffff                         |
| --kit-color-info                  | color        | color             | #0284c7                         |
| --kit-color-info-foreground       | color        | color             | #ffffff                         |
| --kit-color-success               | color        | color             | #16a34a                         |
| --kit-color-success-foreground    | color        | color             | #ffffff                         |
| --kit-color-warning               | color        | color             | #d97706                         |
| --kit-color-warning-foreground    | color        | color             | #111827                         |
| --kit-color-danger                | color        | color             | #dc2626                         |
| --kit-color-danger-hover          | color        | color             | #b91c1c                         |
| --kit-color-danger-foreground     | color        | color             | #ffffff                         |
| --kit-color-link                  | color        | color             | #111827                         |
| --kit-color-link-hover            | color        | color             | #111827                         |
| --kit-focus-ring                  | focus        | color             | #2563eb                         |
| --kit-radius-sm                   | radius       | length            | 0.25rem                         |
| --kit-radius-md                   | radius       | length            | 0.375rem                        |
| --kit-radius-lg                   | radius       | length            | 0.5rem                          |
| --kit-radius-full                 | radius       | length            | 999px                           |
| --kit-border-width                | border       | length            | 1px                             |
| --kit-shadow-sm                   | shadow       | shadow            | 0 1px 2px rgb(15 23 42 / 8%)    |
| --kit-shadow-md                   | shadow       | shadow            | 0 12px 28px rgb(15 23 42 / 14%) |
| --kit-shadow-lg                   | shadow       | shadow            | 0 20px 40px rgb(15 23 42 / 18%) |
| --kit-duration-fast               | motion       | duration          | 120ms                           |
| --kit-duration-normal             | motion       | duration          | 140ms                           |
| --kit-easing-standard             | easing       | string            | cubic-bezier(0.2, 0, 0, 1)      |
| --kit-disabled-opacity            | opacity      | number            | 0.55                            |
| Property                          | Scope        | Source role       | Geometry critical               | Ordered fallback expression                                                                                   |
| --------------------------------  | -----------  | ----------------- | -----------------               | ------------------------------------------------------------------------------------------------------------- |
| --kit-radius-default              | semantic     | default           | no                              | `var(--kit-radius-md)`                                                                                        |
| --kit-radius-control              | semantic     | control           | no                              | `var(--kit-radius-default, var(--kit-radius-md))`                                                             |
| --kit-radius-surface              | semantic     | surface           | no                              | `var(--kit-radius-default, var(--kit-radius-lg))`                                                             |
| --kit-radius-overlay              | semantic     | overlay           | no                              | `var(--kit-radius-default, var(--kit-radius-md))`                                                             |
| --kit-radius-indicator            | semantic     | indicator         | no                              | `var(--kit-radius-default, var(--kit-radius-full))`                                                           |
| --kit-alert-radius                | alert        | surface           | no                              | `var(--kit-radius-surface, var(--kit-radius-default, var(--kit-radius-md)))`                                  |
| --kit-avatar-radius               | avatar       | geometry-critical | yes                             | `var(--kit-radius-full)`                                                                                      |
| --kit-badge-radius                | badge        | indicator         | no                              | `var(--kit-radius-indicator, var(--kit-radius-default, var(--kit-radius-full)))`                              |
| --kit-button-radius               | button       | control           | no                              | `var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md)))`                                  |
| --kit-card-radius                 | card         | surface           | no                              | `var(--kit-radius-surface, var(--kit-radius-default, var(--kit-radius-lg)))`                                  |
| --kit-checkbox-radius             | checkbox     | control           | no                              | `var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-sm)))`                                  |
| --kit-collapsible-trigger-radius  | collapsible  | control           | no                              | `var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md)))`                                  |
| --kit-dialog-trigger-radius       | dialog       | control           | no                              | `var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md)))`                                  |
| --kit-dialog-close-radius         | dialog       | control           | no                              | `var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md)))`                                  |
| --kit-dialog-radius               | dialog       | overlay           | no                              | `var(--kit-radius-overlay, var(--kit-radius-default, var(--kit-radius-md)))`                                  |
| --kit-field-surface-radius        | field        | surface           | no                              | `var(--kit-radius-surface, var(--kit-radius-default, var(--kit-field-control-radius, var(--kit-radius-md))))` |
| --kit-field-control-radius        | field        | control           | no                              | `var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md)))`                                  |
| --kit-input-radius                | field        | control           | no                              | `var(--kit-field-control-radius, var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md))))` |
| --kit-select-radius               | field        | control           | no                              | `var(--kit-field-control-radius, var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md))))` |
| --kit-textarea-radius             | field        | control           | no                              | `var(--kit-field-control-radius, var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md))))` |
| --kit-menu-trigger-radius         | menu         | control           | no                              | `var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md)))`                                  |
| --kit-menu-content-radius         | menu         | overlay           | no                              | `var(--kit-radius-overlay, var(--kit-radius-default, var(--kit-radius-md)))`                                  |
| --kit-menu-item-radius            | menu         | control           | no                              | `var(--kit-radius-control, var(--kit-radius-default, calc(var(--kit-radius-md) - 2px)))`                      |
| --kit-progress-radius             | progress     | indicator         | no                              | `var(--kit-radius-indicator, var(--kit-radius-default, var(--kit-radius-full)))`                              |
| --kit-radio-radius                | radio        | geometry-critical | yes                             | `var(--kit-radius-full)`                                                                                      |
| --kit-skeleton-radius             | skeleton     | surface           | no                              | `var(--kit-radius-surface, var(--kit-radius-default, var(--kit-radius-sm)))`                                  |
| --kit-spinner-radius              | spinner      | geometry-critical | yes                             | `var(--kit-radius-full)`                                                                                      |
| --kit-switch-radius               | switch       | indicator         | no                              | `var(--kit-radius-indicator, var(--kit-radius-default, var(--kit-radius-full)))`                              |
| --kit-switch-thumb-radius         | switch       | geometry-critical | yes                             | `var(--kit-radius-full)`                                                                                      |
| --kit-tabs-trigger-radius         | tabs         | control           | no                              | `var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md)))`                                  |
| Property                          | Scope        | Source role       | Geometry critical               | Ordered fallback expression                                                                                   |
| --------------------------------- | ------------ | -----------       | -----------------               | ----------------------------------------------------------------------------                                  |
| --kit-alert-dialog-trigger-radius | alert-dialog | control           | no                              | `var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md)))`                                  |
| --kit-alert-dialog-cancel-radius  | alert-dialog | control           | no                              | `var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md)))`                                  |
| --kit-alert-dialog-radius         | alert-dialog | overlay           | no                              | `var(--kit-radius-overlay, var(--kit-radius-default, var(--kit-radius-md)))`                                  |
| --kit-alert-dialog-action-radius  | alert-dialog | control           | no                              | `var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md)))`                                  |

## Verification and limits

Read [styling](../../guides/styling.md) and [compatibility](../compatibility.md) before relying on theme, portal, native-reset, CSP or SSR guarantees.
Local behavioral evidence is bounded to the tested native graph and platforms; a type check or successful CLI transaction does not certify arbitrary application behavior.

- [Owning tests/integration/tokens-install.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/integration/tokens-install.test.ts)
