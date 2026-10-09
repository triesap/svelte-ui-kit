# DialogRoot

Complete pinned Dialog compound family with explicit state, refs, snippets and portal composition.

## Install and compose

Installation ID: `dialog`. Explicit requests and dependency closure remain separate.

```svelte
<script lang="ts">
  import {
    DialogRoot,
    DialogTrigger,
    DialogPortal,
    DialogOverlay,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogClose,
  } from "$lib/components/ui";
</script>

<DialogRoot>
  <DialogTrigger>Open details</DialogTrigger>
  <DialogPortal>
    <DialogOverlay />
    <DialogContent>
      <DialogTitle>Details</DialogTitle>
      <DialogDescription>Review this information.</DialogDescription>
      <DialogClose>Close</DialogClose>
    </DialogContent>
  </DialogPortal>
</DialogRoot>
```

## Public contract

Compose DialogRoot, DialogTrigger, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription and DialogClose.
All public types alias exact pinned native types.
Root binds open, default false, forwards children and native callbacks, and has no DOM/ref/class/modal prop.
DOM parts bind actual HTMLElement refs and preserve native attributes/events/classes.
Trigger/Title/Description/Close child receives props; Overlay child receives props/open and its children receives open; Content child receives props/open but default children has no arguments.
There are no floating wrapperProps here.
Supply a real Title or explicit accessible name; optional Description references are guarded against actual live nodes in the bound Content's Document/ShadowRoot, with observer cleanup.
Native focus, Escape/outside cancellation, presence and scroll policies remain intact.
Alert Dialog uses the actual distinct primitive, not role emulation.
All assets form a single dialog compatibility cohort.
Overlay is transparent by default.
Portal to is Element|string (body default), disabled renders inline; theme inheritance and clipping follow the actual target.
First-open completion callbacks and closed forceMount behavior have native limitations described in compatibility.

## Exports and installed assets

The [authoritative manifest](../../../registry/ui/dialog.json) owns this inventory.

| Export                   | Kind  | Local target      |
| ------------------------ | ----- | ----------------- |
| `DialogRoot`             | value | `dialog/index.ts` |
| `DialogTrigger`          | value | `dialog/index.ts` |
| `DialogPortal`           | value | `dialog/index.ts` |
| `DialogOverlay`          | value | `dialog/index.ts` |
| `DialogContent`          | value | `dialog/index.ts` |
| `DialogTitle`            | value | `dialog/index.ts` |
| `DialogDescription`      | value | `dialog/index.ts` |
| `DialogClose`            | value | `dialog/index.ts` |
| `DialogRootProps`        | type  | `dialog/index.ts` |
| `DialogTriggerProps`     | type  | `dialog/index.ts` |
| `DialogPortalProps`      | type  | `dialog/index.ts` |
| `DialogOverlayProps`     | type  | `dialog/index.ts` |
| `DialogContentProps`     | type  | `dialog/index.ts` |
| `DialogTitleProps`       | type  | `dialog/index.ts` |
| `DialogDescriptionProps` | type  | `dialog/index.ts` |
| `DialogCloseProps`       | type  | `dialog/index.ts` |

Registry dependencies: `tokens`.
Npm requirements: `bits-ui` 2.19.5-svelte-ui-kit.2.

- [Authored dialog/root.svelte](../../../registry/ui/dialog/root.svelte)
- [Authored dialog/trigger.svelte](../../../registry/ui/dialog/trigger.svelte)
- [Authored dialog/portal.svelte](../../../registry/ui/dialog/portal.svelte)
- [Authored dialog/overlay.svelte](../../../registry/ui/dialog/overlay.svelte)
- [Authored dialog/content.svelte](../../../registry/ui/dialog/content.svelte)
- [Authored dialog/title.svelte](../../../registry/ui/dialog/title.svelte)
- [Authored dialog/description.svelte](../../../registry/ui/dialog/description.svelte)
- [Authored dialog/close.svelte](../../../registry/ui/dialog/close.svelte)
- [Authored dialog/types.ts](../../../registry/ui/dialog/types.ts)
- [Authored dialog/index.ts](../../../registry/ui/dialog/index.ts)
- [Managed dialog CSS](../../../registry/styles/dialog.css)

Source adaptations preserve the original named surface: `DialogClose`, `DialogContent`, `DialogContentRole`, `DialogDescription`, `DialogRoot`, `DialogTitle`, `DialogTrigger`. The names here describe source attribution, not extra target aliases.

## Source styling and fallback contracts

These source observations retain exact fallback order. Application overrides and semantic defaults are distinct.

| Property                              | Grammar                                                                                                             | Source fallback                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| --kit-dialog-z-index                  | `<integer>`                                                                                                         | `50`                                                                         |
| --kit-dialog-trigger-padding-inline   | `<length-percentage>`                                                                                               | `0.75rem`                                                                    |
| --kit-dialog-trigger-padding-block    | `<length-percentage>`                                                                                               | `0.5rem`                                                                     |
| --kit-dialog-trigger-min-height       | `<length-percentage>`                                                                                               | `2.5rem`                                                                     |
| --kit-dialog-trigger-font-weight      | `<number>`                                                                                                          | `600`                                                                        |
| --kit-dialog-trigger-focus-ring       | `<color>`                                                                                                           | `var(--kit-dialog-focus-ring, var(--kit-focus-ring))`                        |
| --kit-dialog-trigger-disabled-opacity | `<number>`                                                                                                          | `var(--kit-disabled-opacity)`                                                |
| --kit-dialog-trigger-color            | `<color>`                                                                                                           | `var(--kit-color-text)`                                                      |
| --kit-dialog-trigger-border-color     | `<color>`                                                                                                           | `var(--kit-color-border)`                                                    |
| --kit-dialog-trigger-background-hover | `<color>`                                                                                                           | `var(--kit-color-surface-hover)`                                             |
| --kit-dialog-trigger-background       | `<color>`                                                                                                           | `transparent`                                                                |
| --kit-dialog-transition-timing        | `<easing-function>`                                                                                                 | `var(--kit-easing-standard)`                                                 |
| --kit-dialog-transition-duration      | `<time>`                                                                                                            | `var(--kit-duration-normal)`                                                 |
| --kit-dialog-title-line-height        | `<number>`                                                                                                          | `1.25`                                                                       |
| --kit-dialog-title-font-weight        | `<number>`                                                                                                          | `700`                                                                        |
| --kit-dialog-title-font-size          | `<length-percentage>`                                                                                               | `1.125rem`                                                                   |
| --kit-dialog-padding-inline           | `<length-percentage>`                                                                                               | `1.25rem`                                                                    |
| --kit-dialog-padding-block            | `<length-percentage>`                                                                                               | `1.25rem`                                                                    |
| --kit-dialog-max-inline-size          | `<length-percentage>`                                                                                               | `min(32rem, calc(100vw - 2rem))`                                             |
| --kit-dialog-max-block-size           | `<length-percentage>`                                                                                               | `min(42rem, calc(100vh - 2rem))`                                             |
| --kit-dialog-gap                      | `<length-percentage>`                                                                                               | `1rem`                                                                       |
| --kit-dialog-focus-ring               | `<color>`                                                                                                           | `var(--kit-focus-ring)`                                                      |
| --kit-dialog-focus-outline-width      | `<length>`                                                                                                          | `2px`                                                                        |
| --kit-dialog-focus-outline-offset     | `<length>`                                                                                                          | `2px`                                                                        |
| --kit-dialog-elevation                | `<shadow>`                                                                                                          | `var(--kit-shadow-lg)`                                                       |
| --kit-dialog-description-line-height  | `<number>`                                                                                                          | `1.5`                                                                        |
| --kit-dialog-description-font-size    | `<length-percentage>`                                                                                               | `0.9375rem`                                                                  |
| --kit-dialog-description-color        | `<color>`                                                                                                           | `var(--kit-color-text-muted)`                                                |
| --kit-dialog-color                    | `<color>`                                                                                                           | `var(--kit-color-text)`                                                      |
| --kit-dialog-close-padding-inline     | `<length-percentage>`                                                                                               | `0.75rem`                                                                    |
| --kit-dialog-close-padding-block      | `<length-percentage>`                                                                                               | `0.5rem`                                                                     |
| --kit-dialog-close-min-height         | `<length-percentage>`                                                                                               | `2.5rem`                                                                     |
| --kit-dialog-close-font-weight        | `<number>`                                                                                                          | `600`                                                                        |
| --kit-dialog-close-focus-ring         | `<color>`                                                                                                           | `var(--kit-dialog-focus-ring, var(--kit-focus-ring))`                        |
| --kit-dialog-close-disabled-opacity   | `<number>`                                                                                                          | `var(--kit-disabled-opacity)`                                                |
| --kit-dialog-close-color              | `<color>`                                                                                                           | `var(--kit-color-text)`                                                      |
| --kit-dialog-close-border-color       | `<color>`                                                                                                           | `var(--kit-color-border)`                                                    |
| --kit-dialog-close-background-hover   | `<color>`                                                                                                           | `var(--kit-color-surface-hover)`                                             |
| --kit-dialog-close-background         | `<color>`                                                                                                           | `transparent`                                                                |
| --kit-dialog-border-width             | `<length>`                                                                                                          | `var(--kit-border-width)`                                                    |
| --kit-dialog-border-color             | `<color>`                                                                                                           | `var(--kit-color-border)`                                                    |
| --kit-dialog-background               | `<color>`                                                                                                           | `var(--kit-color-surface-raised)`                                            |
| --kit-dialog-trigger-radius           | `<length-percentage>{1,4} [ / <length-percentage>{1,4} ]? \| inherit \| initial \| unset \| revert \| revert-layer` | `var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md)))` |
| --kit-dialog-close-radius             | `<length-percentage>{1,4} [ / <length-percentage>{1,4} ]? \| inherit \| initial \| unset \| revert \| revert-layer` | `var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md)))` |
| --kit-dialog-radius                   | `<length-percentage>{1,4} [ / <length-percentage>{1,4} ]? \| inherit \| initial \| unset \| revert \| revert-layer` | `var(--kit-radius-overlay, var(--kit-radius-default, var(--kit-radius-md)))` |

## Verification and limits

Read [styling](../../guides/styling.md) and [compatibility](../compatibility.md) before relying on theme, portal, native-reset, CSP or SSR guarantees.
Local behavioral evidence is bounded to the tested native graph and platforms; a type check or successful CLI transaction does not certify arbitrary application behavior.

- [Owning tests/components/dialog-content.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/dialog-content.test.ts)
- [Owning tests/components/dialog-css.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/dialog-css.test.ts)
- [Owning tests/components/dialog-labeling.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/dialog-labeling.test.ts)
- [Owning tests/components/dialog-portal-overlay.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/dialog-portal-overlay.test.ts)
- [Owning tests/components/dialog-root-trigger.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/dialog-root-trigger.test.ts)
- [Owning tests/components/dialog-types.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/dialog-types.test.ts)
- [Owning tests/integration/dialog-install.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/integration/dialog-install.test.ts)
- [Owning tests/integration/dialog-ssr.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/integration/dialog-ssr.test.ts)
- [Owning tests/browser/dialog-candidate.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/dialog-candidate.spec.ts)
- [Owning tests/browser/dialog-hydration.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/dialog-hydration.spec.ts)
- [Owning tests/browser/dialog-interactions.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/dialog-interactions.spec.ts)
- [Owning tests/browser/dialog-shadow.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/dialog-shadow.spec.ts)
- [Owning tests/browser/dialog-themes.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/dialog-themes.spec.ts)
