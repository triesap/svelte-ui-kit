# Menu source parity and floating contract

This family adapts the approved ordinary/radio menu surface from the
[immutable Menu source](https://github.com/triesap/leptos_ui_kit/tree/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/ui/menu)
and its
[manifest](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/ui/menu.json).
The source exports Root, Trigger, Content, Item, RadioItem and ItemIndicator,
including controlled checked index, loop/direction, typeahead, selection,
disabled refusal, focus return, placement and dynamic cleanup. Selection is
required original scope. Pinned target behavior belongs to Bits DropdownMenu
2.19.3; no Rust index/keyboard/selection/placement engine is reproduced.

| Public value      | Public type            | Native counterpart                             | Owned design class                |
| ----------------- | ---------------------- | ---------------------------------------------- | --------------------------------- |
| MenuRoot          | MenuRootProps          | DropdownMenu.RootProps                         | none: no DOM                      |
| MenuTrigger       | MenuTriggerProps       | DropdownMenu.TriggerProps                      | kit-menu-trigger                  |
| MenuPortal        | MenuPortalProps        | DropdownMenu.PortalProps                       | none: portal composition          |
| MenuContent       | MenuContentProps       | DropdownMenu.ContentProps                      | kit-menu-content on inner content |
| MenuItem          | MenuItemProps          | DropdownMenu.ItemProps                         | kit-menu-item                     |
| MenuRadioGroup    | MenuRadioGroupProps    | DropdownMenu.RadioGroupProps                   | kit-menu-radio-group              |
| MenuRadioItem     | MenuRadioItemProps     | DropdownMenu.RadioItemProps                    | kit-menu-item kit-menu-radio-item |
| MenuItemIndicator | MenuItemIndicatorProps | native HTML span plus required boolean checked | kit-menu-item-indicator           |

These are exactly eight parts and sixteen eventual flat value/type exports.
Portal is the necessary explicit target-native composition. RadioGroup supplies
the actual required native selection context corresponding to the source Root's
checked index. Applications use stable string values and explicit bind:value,
not positional indices or a second kit selection store. Source ordinary/radio
item kinds map to separate actual primitive parts. Do not advertise the family
until all parts/style/exports exist at S126.

The seven primitive contracts alias the exact pinned public types. Root open
binds explicitly with false initial default, forwards children and native change/
completion callbacks and dir=ltr/rtl, and has no DOM ref/class/modal prop.
Trigger binds its actual HTMLElement/null ref, retains native attributes/events,
merges caller classes and defaults button type to button with native opt-ins.
Content, Item, RadioGroup and RadioItem preserve actual refs/classes/attributes.
RadioGroup value binds explicitly with the native empty string initial default;
RadioItem value is a required string. Native onSelect receives Event; caller
preventDefault, disabled, textValue, closeOnSelect and value callbacks retain
exact native ordering and state. No confirmation, arbitrary kind union or
index-based callback API is invented.

## Snippets and explicit indicator composition

Root/Portal default children has no arguments. Trigger/Item/RadioGroup child
receives native props. RadioItem child receives props and checked; its default
children receives checked. Preserve both rather than swallowing these hooks.
An application composes its visible label and MenuItemIndicator from that real
checked value, using kit-menu-radio-item-label for the source label styling.
Caller label/indicator classes remain ordinary nested-part classes, not an
invented selection API.

MenuItemIndicator is a stateless span, not an upstream alias (DropdownMenu has
no Indicator export). It requires the actual checked boolean, owns hidden and
data-state, binds an HTMLSpanElement/null ref, merges classes and forwards native
span attributes/events and no-argument children. It excludes hidden and unsupported
child hooks rather than accepting and dropping them. No context or effect is
needed. Its checked/unchecked visibility/state preserves the source indicator.

Floating Content child receives distinct wrapperProps, inner props and open.
Apply wrapperProps to an outer element and props to its inner content element;
the design class/styles belong only to the inner element. Native geometry,
anchor measurements, runtime style and attachment/ref structure remain intact.
Default native rendering already retains these two elements. Never flatten the
wrapper, move kit geometry onto it or certify zero runtime inline styling.

## Placement, themes and supported boundary

Map source defaults bottom/start/spacing4/viewportPadding8 to native side=bottom,
align=start, sideOffset=4 and collisionPadding=8; explicit native options remain
forwarded. Actual pinned Dropdown Content defaults loop=true and trapFocus=false,
matching the source wrap policy; its shared declaration comment alone is not the
runtime default. Native side/align/strategy/sticky unions, collision boundaries,
custom anchor, dir, update strategy, scroll/selection policies and cancellation
remain exact. Root direction and Content direction are explicitly composed
through their actual native props; do not infer or invent a kit direction store.

Portal preserves native Element|string to and disabled. Document-level themes
reach body portals; nested themes require suitable explicit native hosts. Live
theme changes and clipping/stacking caveats require S128 rendered evidence. Keep
SSR/hydration and request-local identity; no module-global ID/state or SSR switch.
Source design tokens, radius precedence, disabled/focus/checked/highlighted states
and plain CSS are mapped at S126 to actual native DOM. Source engine-specific
position/translation bindings are replaced by native floating geometry, not
blindly copied onto the inner content.

Sub/SubTrigger/SubContent, ContentStatic, Arrow, CheckboxItem/CheckboxGroup,
arbitrary Group/GroupHeading/Separator and extra selection variants are excluded
from this source-parity batch: the observed source does not require them. RadioGroup
is the specifically necessary native integration part, not adoption of the full
upstream catalog. No MenuItemKind, MenuLoop, MenuDirection Rust enum aliases.

The source's strict-CSP placement claim is not silently inherited. S128 must run
a real CSP fixture, inspect the actual native style output and document measured
supported limits without removing necessary geometry or claiming untested parity.
S127 covers actual installed keyboard/typeahead/selection/cancellation/disabled,
focus return and nested Menu/Dialog layers. Dynamic cleanup, placement, themes,
SSR/hydration and CSP are original acceptance obligations; separate S128 review
must accept the complete RCLD-07 before S129.

## Source design mapping

The source virtual Root wrapper is omitted because native Root owns no DOM.
Source fixed positioning belongs to the native outer wrapper; it is removed
from inner content while its design z-index, grid, tokens, local motion and
all fallback values remain. Native data-disabled replaces source :disabled
on div items. Reduced motion disables the inner transition. The three original
radius entries remain byte-identical; no token defaults change.

| Property                               | Source fallback                                                                          |
| -------------------------------------- | ---------------------------------------------------------------------------------------- |
| --kit-menu-trigger-border-color        | `var(--kit-color-border)`                                                                |
| --kit-menu-trigger-min-height          | `2.5rem`                                                                                 |
| --kit-menu-trigger-padding-block       | `0.5rem`                                                                                 |
| --kit-menu-trigger-padding-inline      | `0.75rem`                                                                                |
| --kit-menu-trigger-background          | `transparent`                                                                            |
| --kit-menu-trigger-color               | `var(--kit-color-text)`                                                                  |
| --kit-menu-trigger-font-weight         | `600`                                                                                    |
| --kit-menu-trigger-background-hover    | `var(--kit-color-surface-hover)`                                                         |
| --kit-menu-trigger-focus-ring          | `var(--kit-focus-ring)`                                                                  |
| --kit-menu-trigger-disabled-opacity    | `var(--kit-disabled-opacity)`                                                            |
| --kit-menu-content-z-index             | `50`                                                                                     |
| --kit-menu-content-gap                 | `0.125rem`                                                                               |
| --kit-menu-content-max-inline-size     | `calc(100vw - 1rem)`                                                                     |
| --kit-menu-content-min-inline-size     | `12rem`                                                                                  |
| --kit-menu-content-border-width        | `var(--kit-border-width)`                                                                |
| --kit-menu-content-border-color        | `var(--kit-color-border)`                                                                |
| --kit-menu-content-padding-block       | `0.25rem`                                                                                |
| --kit-menu-content-padding-inline      | `0.25rem`                                                                                |
| --kit-menu-content-background          | `var(--kit-color-surface-raised)`                                                        |
| --kit-menu-content-color               | `var(--kit-color-text)`                                                                  |
| --kit-menu-content-elevation           | `var(--kit-shadow-md)`                                                                   |
| --kit-menu-content-transition-duration | `var(--kit-duration-fast)`                                                               |
| --kit-menu-content-transition-timing   | `var(--kit-easing-standard)`                                                             |
| --kit-menu-item-indicator-inline-size  | `1rem`                                                                                   |
| --kit-menu-item-gap                    | `0.5rem`                                                                                 |
| --kit-menu-item-min-height             | `2.25rem`                                                                                |
| --kit-menu-item-padding-block          | `0.5rem`                                                                                 |
| --kit-menu-item-padding-inline         | `0.625rem`                                                                               |
| --kit-menu-item-background             | `transparent`                                                                            |
| --kit-menu-item-color                  | `var(--kit-color-text)`                                                                  |
| --kit-menu-item-background-highlighted | `var(--kit-color-surface-hover)`                                                         |
| --kit-menu-item-disabled-opacity       | `var(--kit-disabled-opacity)`                                                            |
| --kit-menu-trigger-radius              | `var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md)))`             |
| --kit-menu-content-radius              | `var(--kit-radius-overlay, var(--kit-radius-default, var(--kit-radius-md)))`             |
| --kit-menu-item-radius                 | `var(--kit-radius-control, var(--kit-radius-default, calc(var(--kit-radius-md) - 2px)))` |

## Pinned typeahead observation

Bits2.19.3 exposes textValue in Item/RadioItem public types but its actual
DOMTypeahead reads trimmed textContent; the primitive forwards textValue as a
DOM attribute rather than using it for search. Installed candidate and direct
native controls qualify identical behavior. DOM-text typeahead remains required
and tested; applications should begin readable labels with searchable text.
The wrapper forwards the exact public prop without adding a kit search engine.
This upstream limitation is explicit evidence for independent S128 review,
not a claim that an alias changes native search behavior.
