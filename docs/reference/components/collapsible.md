# CollapsibleRoot

Pinned native disclosure parts with bindable open state, retained content and source-owned presentation.

## Install and compose

Installation ID: `collapsible`. Explicit requests and dependency closure remain separate.

```svelte
<script lang="ts">
  import {
    CollapsibleRoot,
    CollapsibleTrigger,
    CollapsibleContent,
  } from "$lib/components/ui";
</script>

<CollapsibleRoot>
  <CollapsibleTrigger>Show details</CollapsibleTrigger>
  <CollapsibleContent>More information</CollapsibleContent>
</CollapsibleRoot>
```

## Public contract

Compose CollapsibleRoot, CollapsibleTrigger and CollapsibleContent.
Root binds open (false default), forwards disabled and native change/completion callbacks; all DOM refs and child/children snippets remain native.
Content child receives props and open; children has no arguments.
Trigger is a native button with expanded/controls relationships and disabled refusal; give it a meaningful label.
Content excludes hiddenUntilFound and sets it false: browser-find expansion is outside this API.
Closed children remain mounted.
Default forceMount=false follows native hidden/presence after exit motion; forceMount=true leaves closed DOM visible so the application owns visual hiding.
Native measured height/width and temporary inline animation/transition styles support caller motion, which must respect reduced motion.
SSR trigger controls may be absent before Content registration; hydration links the actual parts.
Rapid toggles and destruction preserve native completion/cleanup.
Compose independent disclosures in app code; there is no Accordion engine.
Denied style attributes reject native SSR measurement styles; hydrated CSSOM measurements do not prove arbitrary CSP/motion support.

## Exports and installed assets

The [authoritative manifest](../../../registry/ui/collapsible.json) owns this inventory.

| Export                    | Kind  | Local target           |
| ------------------------- | ----- | ---------------------- |
| `CollapsibleRoot`         | value | `collapsible/index.ts` |
| `CollapsibleTrigger`      | value | `collapsible/index.ts` |
| `CollapsibleContent`      | value | `collapsible/index.ts` |
| `CollapsibleRootProps`    | type  | `collapsible/index.ts` |
| `CollapsibleTriggerProps` | type  | `collapsible/index.ts` |
| `CollapsibleContentProps` | type  | `collapsible/index.ts` |

Registry dependencies: `tokens`.
Npm requirements: `bits-ui` 2.19.5-svelte-ui-kit.2.

- [Authored collapsible/root.svelte](../../../registry/ui/collapsible/root.svelte)
- [Authored collapsible/trigger.svelte](../../../registry/ui/collapsible/trigger.svelte)
- [Authored collapsible/content.svelte](../../../registry/ui/collapsible/content.svelte)
- [Authored collapsible/types.ts](../../../registry/ui/collapsible/types.ts)
- [Authored collapsible/index.ts](../../../registry/ui/collapsible/index.ts)
- [Managed collapsible CSS](../../../registry/styles/collapsible.css)

Source adaptations preserve the original named surface: `CollapsibleContent`, `CollapsibleRoot`, `CollapsibleTrigger`. The names here describe source attribution, not extra target aliases.

## Source styling and fallback contracts

These source observations retain exact fallback order. Application overrides and semantic defaults are distinct.

| Property                                       | Grammar                                                                                                             | Source fallback                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| --kit-collapsible-trigger-radius               | `<length-percentage>{1,4} [ / <length-percentage>{1,4} ]? \| inherit \| initial \| unset \| revert \| revert-layer` | `var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md)))` |
| --kit-collapsible-gap                          | `<length-percentage>`                                                                                               | `0.5rem`                                                                     |
| --kit-collapsible-trigger-border-color         | `<color>`                                                                                                           | `var(--kit-color-border)`                                                    |
| --kit-collapsible-trigger-min-height           | `<length-percentage>`                                                                                               | `2.5rem`                                                                     |
| --kit-collapsible-trigger-padding-block        | `<length-percentage>`                                                                                               | `0.5rem`                                                                     |
| --kit-collapsible-trigger-padding-inline       | `<length-percentage>`                                                                                               | `0.75rem`                                                                    |
| --kit-collapsible-trigger-background           | `<color>`                                                                                                           | `transparent`                                                                |
| --kit-collapsible-trigger-color                | `<color>`                                                                                                           | `var(--kit-color-text)`                                                      |
| --kit-collapsible-trigger-font-weight          | `<number>`                                                                                                          | `600`                                                                        |
| --kit-collapsible-trigger-background-hover     | `<color>`                                                                                                           | `var(--kit-color-surface-hover)`                                             |
| --kit-collapsible-trigger-focus-outline-width  | `<length-percentage>`                                                                                               | `2px`                                                                        |
| --kit-collapsible-trigger-focus-ring           | `<color>`                                                                                                           | `var(--kit-focus-ring)`                                                      |
| --kit-collapsible-trigger-focus-outline-offset | `<length-percentage>`                                                                                               | `2px`                                                                        |
| --kit-collapsible-trigger-disabled-opacity     | `<number>`                                                                                                          | `var(--kit-disabled-opacity)`                                                |
| --kit-collapsible-content-padding-block        | `<length-percentage>`                                                                                               | `0.5rem`                                                                     |
| --kit-collapsible-content-padding-inline       | `<length-percentage>`                                                                                               | `0`                                                                          |

## Verification and limits

Read [styling](../../guides/styling.md) and [compatibility](../compatibility.md) before relying on theme, portal, native-reset, CSP or SSR guarantees.
Local behavioral evidence is bounded to the tested native graph and platforms; a type check or successful CLI transaction does not certify arbitrary application behavior.

- [Owning tests/components/collapsible-css.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/collapsible-css.test.ts)
- [Owning tests/components/collapsible-parts.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/collapsible-parts.test.ts)
- [Owning tests/components/collapsible-types.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/collapsible-types.test.ts)
- [Owning tests/integration/collapsible-install.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/integration/collapsible-install.test.ts)
- [Owning tests/browser/collapsible-candidate.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/collapsible-candidate.spec.ts)
- [Owning tests/browser/collapsible-csp.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/collapsible-csp.spec.ts)
- [Owning tests/browser/collapsible-styles.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/collapsible-styles.spec.ts)
- [Owning tests/browser/collapsible.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/collapsible.spec.ts)
