# AlertDialogRoot

Distinct complete pinned Alert Dialog family with native decisions and explicit state, refs, snippets and portal composition.

## Install and compose

Installation ID: `alert-dialog`. Explicit requests and dependency closure remain separate.

```svelte
<script lang="ts">
  import {
    AlertDialogRoot,
    AlertDialogTrigger,
    AlertDialogPortal,
    AlertDialogOverlay,
    AlertDialogContent,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogCancel,
  } from "$lib/components/ui";
</script>

<AlertDialogRoot>
  <AlertDialogTrigger>Review decision</AlertDialogTrigger>
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogContent>
      <AlertDialogTitle>Confirm decision</AlertDialogTitle>
      <AlertDialogDescription
        >Review the consequences first.</AlertDialogDescription
      >
      <AlertDialogCancel>Cancel</AlertDialogCancel>
    </AlertDialogContent>
  </AlertDialogPortal>
</AlertDialogRoot>
```

## Public contract

Compose the actual distinct Bits AlertDialog primitive: Root, Trigger, Portal, Overlay, Content, Title, Description, Action and Cancel.
There is no Close alias or generic Dialog role switch.
Root binds open (false default), forwards native callbacks and no-argument children, and has no DOM/ref/class/modal/confirmation props.
DOM parts preserve refs/native attrs and child delegation.
Overlay children receives open, Overlay/Content child receives props/open, and Content children has no arguments.
Content opens by focusing Content, ignores outside interaction by default, and closes on uncanceled Escape.
Do not promise default Cancel autofocus.
Action forwards interaction without automatic close or confirmation; application code decides when bound open changes.
Cancel owns native close/cancellation.
Supply a real accessible name and appropriate description; physical reference guards use only native IDs and actual live nodes.
Native submit/reset opt-ins and portal Element|string/disabled composition remain supported.
Transparent Overlay, logical centered geometry, focus/disabled and reduced-motion styles share the established design.
First-open callbacks and closed forceMount retain native limitations.

## Exports and installed assets

The [authoritative manifest](../../../registry/ui/alert-dialog.json) owns this inventory.

| Export                        | Kind  | Local target            |
| ----------------------------- | ----- | ----------------------- |
| `AlertDialogRoot`             | value | `alert-dialog/index.ts` |
| `AlertDialogTrigger`          | value | `alert-dialog/index.ts` |
| `AlertDialogPortal`           | value | `alert-dialog/index.ts` |
| `AlertDialogOverlay`          | value | `alert-dialog/index.ts` |
| `AlertDialogContent`          | value | `alert-dialog/index.ts` |
| `AlertDialogTitle`            | value | `alert-dialog/index.ts` |
| `AlertDialogDescription`      | value | `alert-dialog/index.ts` |
| `AlertDialogAction`           | value | `alert-dialog/index.ts` |
| `AlertDialogCancel`           | value | `alert-dialog/index.ts` |
| `AlertDialogRootProps`        | type  | `alert-dialog/index.ts` |
| `AlertDialogTriggerProps`     | type  | `alert-dialog/index.ts` |
| `AlertDialogPortalProps`      | type  | `alert-dialog/index.ts` |
| `AlertDialogOverlayProps`     | type  | `alert-dialog/index.ts` |
| `AlertDialogContentProps`     | type  | `alert-dialog/index.ts` |
| `AlertDialogTitleProps`       | type  | `alert-dialog/index.ts` |
| `AlertDialogDescriptionProps` | type  | `alert-dialog/index.ts` |
| `AlertDialogActionProps`      | type  | `alert-dialog/index.ts` |
| `AlertDialogCancelProps`      | type  | `alert-dialog/index.ts` |

Registry dependencies: `tokens`.
Npm requirements: `bits-ui` 2.19.5-svelte-ui-kit.2.

- [Authored alert-dialog/root.svelte](../../../registry/ui/alert-dialog/root.svelte)
- [Authored alert-dialog/trigger.svelte](../../../registry/ui/alert-dialog/trigger.svelte)
- [Authored alert-dialog/portal.svelte](../../../registry/ui/alert-dialog/portal.svelte)
- [Authored alert-dialog/overlay.svelte](../../../registry/ui/alert-dialog/overlay.svelte)
- [Authored alert-dialog/content.svelte](../../../registry/ui/alert-dialog/content.svelte)
- [Authored alert-dialog/title.svelte](../../../registry/ui/alert-dialog/title.svelte)
- [Authored alert-dialog/description.svelte](../../../registry/ui/alert-dialog/description.svelte)
- [Authored alert-dialog/action.svelte](../../../registry/ui/alert-dialog/action.svelte)
- [Authored alert-dialog/cancel.svelte](../../../registry/ui/alert-dialog/cancel.svelte)
- [Authored alert-dialog/types.ts](../../../registry/ui/alert-dialog/types.ts)
- [Authored alert-dialog/index.ts](../../../registry/ui/alert-dialog/index.ts)
- [Managed alert-dialog CSS](../../../registry/styles/alert-dialog.css)

## Source styling and fallback contracts

These source observations retain exact fallback order. Application overrides and semantic defaults are distinct.

| Property                                    | Grammar                                                                                                             | Source fallback                                                              |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| --kit-alert-dialog-z-index                  | `<integer>`                                                                                                         | `50`                                                                         |
| --kit-alert-dialog-trigger-padding-inline   | `<length-percentage>`                                                                                               | `0.75rem`                                                                    |
| --kit-alert-dialog-trigger-padding-block    | `<length-percentage>`                                                                                               | `0.5rem`                                                                     |
| --kit-alert-dialog-trigger-min-height       | `<length-percentage>`                                                                                               | `2.5rem`                                                                     |
| --kit-alert-dialog-trigger-font-weight      | `<number>`                                                                                                          | `600`                                                                        |
| --kit-alert-dialog-trigger-focus-ring       | `<color>`                                                                                                           | `var(--kit-alert-dialog-focus-ring, var(--kit-focus-ring))`                  |
| --kit-alert-dialog-trigger-disabled-opacity | `<number>`                                                                                                          | `var(--kit-disabled-opacity)`                                                |
| --kit-alert-dialog-trigger-color            | `<color>`                                                                                                           | `var(--kit-color-text)`                                                      |
| --kit-alert-dialog-trigger-border-color     | `<color>`                                                                                                           | `var(--kit-color-border)`                                                    |
| --kit-alert-dialog-trigger-background-hover | `<color>`                                                                                                           | `var(--kit-color-surface-hover)`                                             |
| --kit-alert-dialog-trigger-background       | `<color>`                                                                                                           | `transparent`                                                                |
| --kit-alert-dialog-transition-timing        | `<easing-function>`                                                                                                 | `var(--kit-easing-standard)`                                                 |
| --kit-alert-dialog-transition-duration      | `<time>`                                                                                                            | `var(--kit-duration-normal)`                                                 |
| --kit-alert-dialog-title-line-height        | `<number>`                                                                                                          | `1.25`                                                                       |
| --kit-alert-dialog-title-font-weight        | `<number>`                                                                                                          | `700`                                                                        |
| --kit-alert-dialog-title-font-size          | `<length-percentage>`                                                                                               | `1.125rem`                                                                   |
| --kit-alert-dialog-padding-inline           | `<length-percentage>`                                                                                               | `1.25rem`                                                                    |
| --kit-alert-dialog-padding-block            | `<length-percentage>`                                                                                               | `1.25rem`                                                                    |
| --kit-alert-dialog-max-inline-size          | `<length-percentage>`                                                                                               | `min(32rem, calc(100vw - 2rem))`                                             |
| --kit-alert-dialog-max-block-size           | `<length-percentage>`                                                                                               | `min(42rem, calc(100vh - 2rem))`                                             |
| --kit-alert-dialog-gap                      | `<length-percentage>`                                                                                               | `1rem`                                                                       |
| --kit-alert-dialog-focus-ring               | `<color>`                                                                                                           | `var(--kit-focus-ring)`                                                      |
| --kit-alert-dialog-focus-outline-width      | `<length>`                                                                                                          | `2px`                                                                        |
| --kit-alert-dialog-focus-outline-offset     | `<length>`                                                                                                          | `2px`                                                                        |
| --kit-alert-dialog-elevation                | `<shadow>`                                                                                                          | `var(--kit-shadow-lg)`                                                       |
| --kit-alert-dialog-description-line-height  | `<number>`                                                                                                          | `1.5`                                                                        |
| --kit-alert-dialog-description-font-size    | `<length-percentage>`                                                                                               | `0.9375rem`                                                                  |
| --kit-alert-dialog-description-color        | `<color>`                                                                                                           | `var(--kit-color-text-muted)`                                                |
| --kit-alert-dialog-color                    | `<color>`                                                                                                           | `var(--kit-color-text)`                                                      |
| --kit-alert-dialog-cancel-padding-inline    | `<length-percentage>`                                                                                               | `0.75rem`                                                                    |
| --kit-alert-dialog-cancel-padding-block     | `<length-percentage>`                                                                                               | `0.5rem`                                                                     |
| --kit-alert-dialog-cancel-min-height        | `<length-percentage>`                                                                                               | `2.5rem`                                                                     |
| --kit-alert-dialog-cancel-font-weight       | `<number>`                                                                                                          | `600`                                                                        |
| --kit-alert-dialog-cancel-focus-ring        | `<color>`                                                                                                           | `var(--kit-alert-dialog-focus-ring, var(--kit-focus-ring))`                  |
| --kit-alert-dialog-cancel-disabled-opacity  | `<number>`                                                                                                          | `var(--kit-disabled-opacity)`                                                |
| --kit-alert-dialog-cancel-color             | `<color>`                                                                                                           | `var(--kit-color-text)`                                                      |
| --kit-alert-dialog-cancel-border-color      | `<color>`                                                                                                           | `var(--kit-color-border)`                                                    |
| --kit-alert-dialog-cancel-background-hover  | `<color>`                                                                                                           | `var(--kit-color-surface-hover)`                                             |
| --kit-alert-dialog-cancel-background        | `<color>`                                                                                                           | `transparent`                                                                |
| --kit-alert-dialog-border-width             | `<length>`                                                                                                          | `var(--kit-border-width)`                                                    |
| --kit-alert-dialog-border-color             | `<color>`                                                                                                           | `var(--kit-color-border)`                                                    |
| --kit-alert-dialog-background               | `<color>`                                                                                                           | `var(--kit-color-surface-raised)`                                            |
| --kit-alert-dialog-trigger-radius           | `<length-percentage>{1,4} [ / <length-percentage>{1,4} ]? \| inherit \| initial \| unset \| revert \| revert-layer` | `var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md)))` |
| --kit-alert-dialog-cancel-radius            | `<length-percentage>{1,4} [ / <length-percentage>{1,4} ]? \| inherit \| initial \| unset \| revert \| revert-layer` | `var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md)))` |
| --kit-alert-dialog-radius                   | `<length-percentage>{1,4} [ / <length-percentage>{1,4} ]? \| inherit \| initial \| unset \| revert \| revert-layer` | `var(--kit-radius-overlay, var(--kit-radius-default, var(--kit-radius-md)))` |
| --kit-alert-dialog-action-padding-inline    | `<length-percentage>`                                                                                               | `0.75rem`                                                                    |
| --kit-alert-dialog-action-padding-block     | `<length-percentage>`                                                                                               | `0.5rem`                                                                     |
| --kit-alert-dialog-action-min-height        | `<length-percentage>`                                                                                               | `2.5rem`                                                                     |
| --kit-alert-dialog-action-font-weight       | `<number>`                                                                                                          | `600`                                                                        |
| --kit-alert-dialog-action-focus-ring        | `<color>`                                                                                                           | `var(--kit-alert-dialog-focus-ring, var(--kit-focus-ring))`                  |
| --kit-alert-dialog-action-disabled-opacity  | `<number>`                                                                                                          | `var(--kit-disabled-opacity)`                                                |
| --kit-alert-dialog-action-color             | `<color>`                                                                                                           | `var(--kit-color-text)`                                                      |
| --kit-alert-dialog-action-border-color      | `<color>`                                                                                                           | `var(--kit-color-border)`                                                    |
| --kit-alert-dialog-action-background-hover  | `<color>`                                                                                                           | `var(--kit-color-surface-hover)`                                             |
| --kit-alert-dialog-action-background        | `<color>`                                                                                                           | `transparent`                                                                |
| --kit-alert-dialog-action-radius            | `<length-percentage>{1,4} [ / <length-percentage>{1,4} ]? \| inherit \| initial \| unset \| revert \| revert-layer` | `var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md)))` |

## Verification and limits

Read [styling](../../guides/styling.md) and [compatibility](../compatibility.md) before relying on theme, portal, native-reset, CSP or SSR guarantees.
Local behavioral evidence is bounded to the tested native graph and platforms; a type check or successful CLI transaction does not certify arbitrary application behavior.

- [Owning tests/components/alert-dialog-actions.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/alert-dialog-actions.test.ts)
- [Owning tests/components/alert-dialog-content.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/alert-dialog-content.test.ts)
- [Owning tests/components/alert-dialog-state.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/alert-dialog-state.test.ts)
- [Owning tests/components/alert-dialog-types.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/alert-dialog-types.test.ts)
- [Owning tests/integration/alert-dialog-install.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/integration/alert-dialog-install.test.ts)
- [Owning tests/integration/alert-dialog-ssr.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/integration/alert-dialog-ssr.test.ts)
- [Owning tests/browser/alert-dialog-candidate.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/alert-dialog-candidate.spec.ts)
- [Owning tests/browser/alert-dialog-hydration.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/alert-dialog-hydration.spec.ts)
- [Owning tests/browser/alert-dialog-interactions.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/alert-dialog-interactions.spec.ts)
- [Owning tests/browser/alert-dialog-themes.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/alert-dialog-themes.spec.ts)
