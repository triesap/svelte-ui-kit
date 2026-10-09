# TabsRoot

Pinned Tabs family with string selection, native activation, stable panel identity and always-mounted hidden content.

## Install and compose

Installation ID: `tabs`. Explicit requests and dependency closure remain separate.

```svelte
<script lang="ts">
  import {
    TabsRoot,
    TabsList,
    TabsTrigger,
    TabsContent,
  } from "$lib/components/ui";
</script>

<TabsRoot value="account">
  <TabsList aria-label="Settings">
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="security">Security</TabsTrigger>
  </TabsList>
  <TabsContent value="account">Account settings</TabsContent>
  <TabsContent value="security">Security settings</TabsContent>
</TabsRoot>
```

## Public contract

Compose TabsRoot, TabsList, TabsTrigger and TabsContent with matching string values.
Root binds value (empty default) and forwards disabled, orientation, activationMode and loop.
Observed defaults are automatic/horizontal/loop=true despite an inconsistent native loop comment.
Each DOM part binds its actual ref and preserves child({props})/no-argument children; spread delegated props on the real element.
Automatic focus selects; manual mode waits for Space/Enter/click.
Native disabled skipping, RTL, clamp/wrap, arrows/Home/End and cancellation remain intact.
Empty/unmatched values can hide every panel; no automatic first choice is invented.
Content is always mounted and uses native hidden; no forceMount, open, presence callback or unmount-on-hide API exists.
Native reciprocal controls/labelledby relationships complete after registration/hydration and update on removal/remount.
The panel keeps input DOM/state while hidden.
SSR relationship timing differs from hydrated DOM; do not synthesize IDs or infer server links from browser effects.

## Exports and installed assets

The [authoritative manifest](../../../registry/ui/tabs.json) owns this inventory.

| Export             | Kind  | Local target    |
| ------------------ | ----- | --------------- |
| `TabsRoot`         | value | `tabs/index.ts` |
| `TabsList`         | value | `tabs/index.ts` |
| `TabsTrigger`      | value | `tabs/index.ts` |
| `TabsContent`      | value | `tabs/index.ts` |
| `TabsRootProps`    | type  | `tabs/index.ts` |
| `TabsListProps`    | type  | `tabs/index.ts` |
| `TabsTriggerProps` | type  | `tabs/index.ts` |
| `TabsContentProps` | type  | `tabs/index.ts` |

Registry dependencies: `tokens`.
Npm requirements: `bits-ui` 2.19.5-svelte-ui-kit.2.

- [Authored tabs/root.svelte](../../../registry/ui/tabs/root.svelte)
- [Authored tabs/list.svelte](../../../registry/ui/tabs/list.svelte)
- [Authored tabs/trigger.svelte](../../../registry/ui/tabs/trigger.svelte)
- [Authored tabs/content.svelte](../../../registry/ui/tabs/content.svelte)
- [Authored tabs/types.ts](../../../registry/ui/tabs/types.ts)
- [Authored tabs/index.ts](../../../registry/ui/tabs/index.ts)
- [Managed tabs CSS](../../../registry/styles/tabs.css)

Source adaptations preserve the original named surface: `TabsActivation`, `TabsDirection`, `TabsList`, `TabsLoop`, `TabsOrientation`, `TabsPanel`, `TabsRoot`, `TabsTrigger`. The names here describe source attribution, not extra target aliases.

## Source styling and fallback contracts

These source observations retain exact fallback order. Application overrides and semantic defaults are distinct.

| Property                                | Grammar                                                                                                             | Source fallback                                                              |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| --kit-tabs-trigger-radius               | `<length-percentage>{1,4} [ / <length-percentage>{1,4} ]? \| inherit \| initial \| unset \| revert \| revert-layer` | `var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md)))` |
| --kit-tabs-gap                          | `<length-percentage>`                                                                                               | `1rem`                                                                       |
| --kit-tabs-list-gap                     | `<length-percentage>`                                                                                               | `0.25rem`                                                                    |
| --kit-tabs-trigger-border-color         | `<color>`                                                                                                           | `var(--kit-color-border)`                                                    |
| --kit-tabs-trigger-min-height           | `<length-percentage>`                                                                                               | `2.5rem`                                                                     |
| --kit-tabs-trigger-padding-block        | `<length-percentage>`                                                                                               | `0.5rem`                                                                     |
| --kit-tabs-trigger-padding-inline       | `<length-percentage>`                                                                                               | `0.75rem`                                                                    |
| --kit-tabs-trigger-background           | `<color>`                                                                                                           | `transparent`                                                                |
| --kit-tabs-trigger-color-inactive       | `<color>`                                                                                                           | `var(--kit-color-text-secondary)`                                            |
| --kit-tabs-trigger-font-weight          | `<number>`                                                                                                          | `600`                                                                        |
| --kit-tabs-trigger-background-active    | `<color>`                                                                                                           | `var(--kit-color-surface)`                                                   |
| --kit-tabs-trigger-color                | `<color>`                                                                                                           | `var(--kit-color-text)`                                                      |
| --kit-tabs-trigger-background-hover     | `<color>`                                                                                                           | `var(--kit-color-surface-hover)`                                             |
| --kit-tabs-trigger-focus-outline-width  | `<length-percentage>`                                                                                               | `2px`                                                                        |
| --kit-tabs-trigger-focus-ring           | `<color>`                                                                                                           | `var(--kit-focus-ring)`                                                      |
| --kit-tabs-trigger-focus-outline-offset | `<length-percentage>`                                                                                               | `2px`                                                                        |
| --kit-tabs-trigger-disabled-opacity     | `<number>`                                                                                                          | `var(--kit-disabled-opacity)`                                                |
| --kit-tabs-panel-padding-block          | `<length-percentage>`                                                                                               | `0.75rem`                                                                    |
| --kit-tabs-panel-padding-inline         | `<length-percentage>`                                                                                               | `0`                                                                          |
| --kit-tabs-panel-background             | `<color>`                                                                                                           | `transparent`                                                                |
| --kit-tabs-panel-color                  | `<color>`                                                                                                           | `inherit`                                                                    |
| --kit-tabs-panel-focus-outline-width    | `<length-percentage>`                                                                                               | `2px`                                                                        |
| --kit-tabs-panel-focus-ring             | `<color>`                                                                                                           | `var(--kit-focus-ring)`                                                      |
| --kit-tabs-panel-focus-outline-offset   | `<length-percentage>`                                                                                               | `2px`                                                                        |

## Verification and limits

Read [styling](../../guides/styling.md) and [compatibility](../compatibility.md) before relying on theme, portal, native-reset, CSP or SSR guarantees.
Local behavioral evidence is bounded to the tested native graph and platforms; a type check or successful CLI transaction does not certify arbitrary application behavior.

- [Owning tests/components/tabs-css.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/tabs-css.test.ts)
- [Owning tests/components/tabs-parts.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/tabs-parts.test.ts)
- [Owning tests/components/tabs-root-list.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/tabs-root-list.test.ts)
- [Owning tests/components/tabs-types.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/tabs-types.test.ts)
- [Owning tests/integration/tabs-install.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/integration/tabs-install.test.ts)
- [Owning tests/browser/tabs-candidate.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/tabs-candidate.spec.ts)
- [Owning tests/browser/tabs-parts.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/tabs-parts.spec.ts)
- [Owning tests/browser/tabs-styles.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/tabs-styles.spec.ts)
- [Owning tests/browser/tabs.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/tabs.spec.ts)
