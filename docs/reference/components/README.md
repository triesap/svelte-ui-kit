# Component reference

Installable items come from the [bundled registry](../../../registry/registry.json).
Install with `node "$CLI" --cwd "$APP" add <id>` after [getting started](../../getting-started.md).
Import values and types from the application-owned UI barrel; custom mappings change that local import path.
Types and manifests own the supported API; the wider upstream catalog is not the kit API.

| Item                            | Use                                                                                                                           |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| [alert](alert.md)               | Native assertive message presentation with application-owned content and source alert styles.                                 |
| [alert-dialog](alert-dialog.md) | Distinct complete pinned Alert Dialog family with native decisions and explicit state, refs, snippets and portal composition. |
| [anchor](anchor.md)             | Native typed link presentation with source target and rel safety defaults.                                                    |
| [avatar](avatar.md)             | Native image avatar with accessible optional loading and failure fallback.                                                    |
| [badge](badge.md)               | Native text-bearing span presentation with source badge styles.                                                               |
| [button](button.md)             | Native button with source design variants and loading-safe semantics.                                                         |
| [card](card.md)                 | Native sectioning surface with application-owned content and source card styles.                                              |
| [checkbox](checkbox.md)         | Thin pinned Bits Checkbox with fixed owned SVG and native form participation.                                                 |
| [collapsible](collapsible.md)   | Pinned native disclosure parts with bindable open state, retained content and source-owned presentation.                      |
| [dialog](dialog.md)             | Complete pinned Dialog compound family with explicit state, refs, snippets and portal composition.                            |
| [field](field.md)               | Native form controls, labels, owned dynamic messages and complete source convenience recipes.                                 |
| [menu](menu.md)                 | Complete ordinary and controlled radio Menu family preserving native floating placement, snippets, refs and selection.        |
| [progress](progress.md)         | Native numeric progress bounds and indeterminate state with source progress styles.                                           |
| [radio](radio.md)               | Pinned Radio group and item with controlled string selection, fixed radial mark and native one-field forms.                   |
| [router-link](router-link.md)   | Optional native SvelteKit link recipe reusing Anchor source and design.                                                       |
| [separator](separator.md)       | Native meaningful or decorative separator with source orientation and semantic border geometry.                               |
| [skeleton](skeleton.md)         | Empty native decorative loading placeholder with source surface and radius styles.                                            |
| [spinner](spinner.md)           | Native decorative and status loading presentation.                                                                            |
| [status](status.md)             | Native paragraph feedback with source role politeness atomic options and source status styles.                                |
| [switch](switch.md)             | Thin pinned Bits Switch with owned Thumb and explicit state/ref bindings.                                                     |
| [tabs](tabs.md)                 | Pinned Tabs family with string selection, native activation, stable panel identity and always-mounted hidden content.         |
| [tokens](tokens.md)             | Portable semantic design defaults in plain CSS.                                                                               |

## Shared identity and source scope

Identity is deliberately non-generated; see [shared identity](../compatibility.md#identity-and-ssr).
The original source KitIdProvider/use_kit_id is an adaptation, not an installable alias.
Alert Dialog is the sole additional component family beyond the original generated source catalog.
Tokens is CSS-only. Actual manifest exports above govern imports, not upstream names.
