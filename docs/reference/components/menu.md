# MenuRoot

Complete ordinary and controlled radio Menu family preserving native floating placement, snippets, refs and selection.

## Install and compose

Installation ID: `menu`. Explicit requests and dependency closure remain separate.

```svelte
<script lang="ts">
  import {
    MenuRoot,
    MenuTrigger,
    MenuPortal,
    MenuContent,
    MenuItem,
  } from "$lib/components/ui";
</script>

<MenuRoot>
  <MenuTrigger>Actions</MenuTrigger>
  <MenuPortal>
    <MenuContent>
      <MenuItem onSelect={() => console.log("Copy selected")}>Copy</MenuItem>
    </MenuContent>
  </MenuPortal>
</MenuRoot>
```

## Public contract

Compose MenuRoot, MenuTrigger, MenuPortal, MenuContent, MenuItem, MenuRadioGroup, MenuRadioItem and MenuItemIndicator.
This adapts the source checked index to native stable string values; RadioGroup binds value and RadioItem requires value.
There is no Rust index/typeahead/placement engine.
Root binds open and has no DOM/ref/class/modal prop.
Native onSelect Event, preventDefault, disabled, closeOnSelect and selection callbacks retain order.
RadioItem children receives checked; compose its label with `kit-menu-radio-item-label` and MenuItemIndicator checked.
Indicator is a stateless native span with required boolean checked, native ref/children, owned hidden/data-state and no delegated child hook.
Floating Content child receives distinct wrapperProps, inner props and open; spread these on outer and inner elements respectively.
Design CSS belongs to inner content.
Defaults are bottom/start/sideOffset=4/collisionPadding=8, loop=true, trapFocus=false.
Portal hosts retain actual theme/clipping/stacking behavior.
No Sub, Arrow, ContentStatic, CheckboxItem, extra Group or separator API is advertised.
Native typeahead reads trimmed DOM textContent despite public textValue; start labels with searchable text.
The strict-CSP source claim is not inherited: denying style attributes rejects initial SSR floating geometry.
Compatible measured policy uses nonce scripts, self-hosted CSS and allowed style attributes.

## Exports and installed assets

The [authoritative manifest](../../../registry/ui/menu.json) owns this inventory.

| Export                   | Kind  | Local target    |
| ------------------------ | ----- | --------------- |
| `MenuRoot`               | value | `menu/index.ts` |
| `MenuTrigger`            | value | `menu/index.ts` |
| `MenuPortal`             | value | `menu/index.ts` |
| `MenuContent`            | value | `menu/index.ts` |
| `MenuItem`               | value | `menu/index.ts` |
| `MenuRadioGroup`         | value | `menu/index.ts` |
| `MenuRadioItem`          | value | `menu/index.ts` |
| `MenuItemIndicator`      | value | `menu/index.ts` |
| `MenuRootProps`          | type  | `menu/index.ts` |
| `MenuTriggerProps`       | type  | `menu/index.ts` |
| `MenuPortalProps`        | type  | `menu/index.ts` |
| `MenuContentProps`       | type  | `menu/index.ts` |
| `MenuItemProps`          | type  | `menu/index.ts` |
| `MenuRadioGroupProps`    | type  | `menu/index.ts` |
| `MenuRadioItemProps`     | type  | `menu/index.ts` |
| `MenuItemIndicatorProps` | type  | `menu/index.ts` |

Registry dependencies: `tokens`.
Npm requirements: `bits-ui` 2.19.5-svelte-ui-kit.2.

- [Authored menu/root.svelte](../../../registry/ui/menu/root.svelte)
- [Authored menu/trigger.svelte](../../../registry/ui/menu/trigger.svelte)
- [Authored menu/portal.svelte](../../../registry/ui/menu/portal.svelte)
- [Authored menu/content.svelte](../../../registry/ui/menu/content.svelte)
- [Authored menu/item.svelte](../../../registry/ui/menu/item.svelte)
- [Authored menu/radio-group.svelte](../../../registry/ui/menu/radio-group.svelte)
- [Authored menu/radio-item.svelte](../../../registry/ui/menu/radio-item.svelte)
- [Authored menu/item-indicator.svelte](../../../registry/ui/menu/item-indicator.svelte)
- [Authored menu/types.ts](../../../registry/ui/menu/types.ts)
- [Authored menu/index.ts](../../../registry/ui/menu/index.ts)
- [Managed menu CSS](../../../registry/styles/menu.css)

Source adaptations preserve the original named surface: `MenuContent`, `MenuContentAlign`, `MenuContentSide`, `MenuDirection`, `MenuItem`, `MenuItemIndicator`, `MenuItemKind`, `MenuLoop`, `MenuRadioItem`, `MenuRoot`, `MenuTrigger`. The names here describe source attribution, not extra target aliases.

## Source styling and fallback contracts

These source observations retain exact fallback order. Application overrides and semantic defaults are distinct.

| Property                               | Grammar                                                                                                             | Source fallback                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| --kit-menu-trigger-radius              | `<length-percentage>{1,4} [ / <length-percentage>{1,4} ]? \| inherit \| initial \| unset \| revert \| revert-layer` | `var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md)))`             |
| --kit-menu-content-radius              | `<length-percentage>{1,4} [ / <length-percentage>{1,4} ]? \| inherit \| initial \| unset \| revert \| revert-layer` | `var(--kit-radius-overlay, var(--kit-radius-default, var(--kit-radius-md)))`             |
| --kit-menu-item-radius                 | `<length-percentage>{1,4} [ / <length-percentage>{1,4} ]? \| inherit \| initial \| unset \| revert \| revert-layer` | `var(--kit-radius-control, var(--kit-radius-default, calc(var(--kit-radius-md) - 2px)))` |
| --kit-menu-trigger-border-color        | `<color>`                                                                                                           | `var(--kit-color-border)`                                                                |
| --kit-menu-trigger-min-height          | `<length-percentage>`                                                                                               | `2.5rem`                                                                                 |
| --kit-menu-trigger-padding-block       | `<length-percentage>`                                                                                               | `0.5rem`                                                                                 |
| --kit-menu-trigger-padding-inline      | `<length-percentage>`                                                                                               | `0.75rem`                                                                                |
| --kit-menu-trigger-background          | `<color>`                                                                                                           | `transparent`                                                                            |
| --kit-menu-trigger-color               | `<color>`                                                                                                           | `var(--kit-color-text)`                                                                  |
| --kit-menu-trigger-font-weight         | `<number>`                                                                                                          | `600`                                                                                    |
| --kit-menu-trigger-background-hover    | `<color>`                                                                                                           | `var(--kit-color-surface-hover)`                                                         |
| --kit-menu-trigger-focus-ring          | `<color>`                                                                                                           | `var(--kit-focus-ring)`                                                                  |
| --kit-menu-trigger-disabled-opacity    | `<number>`                                                                                                          | `var(--kit-disabled-opacity)`                                                            |
| --kit-menu-content-z-index             | `<integer>`                                                                                                         | `50`                                                                                     |
| --kit-menu-content-gap                 | `<length-percentage>`                                                                                               | `0.125rem`                                                                               |
| --kit-menu-content-max-inline-size     | `<length-percentage>`                                                                                               | `calc(100vw - 1rem)`                                                                     |
| --kit-menu-content-min-inline-size     | `<length-percentage>`                                                                                               | `12rem`                                                                                  |
| --kit-menu-content-border-width        | `<length-percentage>`                                                                                               | `var(--kit-border-width)`                                                                |
| --kit-menu-content-border-color        | `<color>`                                                                                                           | `var(--kit-color-border)`                                                                |
| --kit-menu-content-padding-block       | `<length-percentage>`                                                                                               | `0.25rem`                                                                                |
| --kit-menu-content-padding-inline      | `<length-percentage>`                                                                                               | `0.25rem`                                                                                |
| --kit-menu-content-background          | `<color>`                                                                                                           | `var(--kit-color-surface-raised)`                                                        |
| --kit-menu-content-color               | `<color>`                                                                                                           | `var(--kit-color-text)`                                                                  |
| --kit-menu-content-elevation           | `<shadow>`                                                                                                          | `var(--kit-shadow-md)`                                                                   |
| --kit-menu-content-transition-duration | `<time>`                                                                                                            | `var(--kit-duration-fast)`                                                               |
| --kit-menu-content-transition-timing   | `<easing-function>`                                                                                                 | `var(--kit-easing-standard)`                                                             |
| --kit-menu-item-indicator-inline-size  | `<length-percentage>`                                                                                               | `1rem`                                                                                   |
| --kit-menu-item-gap                    | `<length-percentage>`                                                                                               | `0.5rem`                                                                                 |
| --kit-menu-item-min-height             | `<length-percentage>`                                                                                               | `2.25rem`                                                                                |
| --kit-menu-item-padding-block          | `<length-percentage>`                                                                                               | `0.5rem`                                                                                 |
| --kit-menu-item-padding-inline         | `<length-percentage>`                                                                                               | `0.625rem`                                                                               |
| --kit-menu-item-background             | `<color>`                                                                                                           | `transparent`                                                                            |
| --kit-menu-item-color                  | `<color>`                                                                                                           | `var(--kit-color-text)`                                                                  |
| --kit-menu-item-background-highlighted | `<color>`                                                                                                           | `var(--kit-color-surface-hover)`                                                         |
| --kit-menu-item-disabled-opacity       | `<number>`                                                                                                          | `var(--kit-disabled-opacity)`                                                            |

## Verification and limits

Read [styling](../../guides/styling.md) and [compatibility](../compatibility.md) before relying on theme, portal, native-reset, CSP or SSR guarantees.
Local behavioral evidence is bounded to the tested native graph and platforms; a type check or successful CLI transaction does not certify arbitrary application behavior.

- [Owning tests/components/menu-content.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/menu-content.test.ts)
- [Owning tests/components/menu-css.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/menu-css.test.ts)
- [Owning tests/components/menu-items.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/menu-items.test.ts)
- [Owning tests/components/menu-state.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/menu-state.test.ts)
- [Owning tests/components/menu-types.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/menu-types.test.ts)
- [Owning tests/integration/menu-install.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/integration/menu-install.test.ts)
- [Owning tests/integration/menu-ssr.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/integration/menu-ssr.test.ts)
- [Owning tests/browser/menu-candidate.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/menu-candidate.spec.ts)
- [Owning tests/browser/menu-csp.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/menu-csp.spec.ts)
- [Owning tests/browser/menu-keyboard.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/menu-keyboard.spec.ts)
- [Owning tests/browser/menu-lifecycle.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/menu-lifecycle.spec.ts)
- [Owning tests/browser/menu-placement.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/menu-placement.spec.ts)
- [Owning tests/browser/menu-styles.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/menu-styles.spec.ts)
