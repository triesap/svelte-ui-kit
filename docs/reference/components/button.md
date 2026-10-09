# Button

Native button with source design variants and loading-safe semantics.

## Install and compose

Installation ID: `button`. Explicit requests and dependency closure remain separate.

```svelte
<script lang="ts">
  import { Button } from "$lib/components/ui";
</script>

<Button type="submit">Save</Button>
```

## Public contract

A native button with required children, `variant` primary/secondary/ghost (primary default), `size` sm/md/lg (md default), boolean loading and disabled, loadingLabel (Loading default), and bindable HTMLButtonElement ref.
It defaults to type=button; explicit submit/reset remains native.
Loading disables activation, owns aria-busy, renders decorative Spinner and an accessible loading label, and retains child DOM.
Caller classes, native events and cancellation survive.
There is no link polymorphism or replacement-child hook.
Supply a meaningful visible label.
Loading behavior does not implement an application action or async state store.

## Exports and installed assets

The [authoritative manifest](../../../registry/ui/button.json) owns this inventory.

| Export          | Kind  | Local target      |
| --------------- | ----- | ----------------- |
| `Button`        | value | `button.svelte`   |
| `ButtonProps`   | type  | `button.types.ts` |
| `ButtonVariant` | type  | `button.types.ts` |
| `ButtonSize`    | type  | `button.types.ts` |

Registry dependencies: `spinner`, `tokens`.
Npm requirements: none.

- [Authored button.svelte](../../../registry/ui/button.svelte)
- [Authored button.types.ts](../../../registry/ui/button.types.ts)
- [Managed button CSS](../../../registry/styles/button.css)

Source adaptations preserve the original named surface: `Button`, `ButtonSize`, `ButtonType`, `ButtonVariant`. The names here describe source attribution, not extra target aliases.

## Source styling and fallback contracts

These source observations retain exact fallback order. Application overrides and semantic defaults are distinct.

| Property                          | Grammar                                                                                                             | Source fallback                                                              |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| --kit-button-lg-font-size         | `<length-percentage>`                                                                                               | `1rem`                                                                       |
| --kit-button-lg-padding-inline    | `<length-percentage>`                                                                                               | `1.25rem`                                                                    |
| --kit-button-lg-min-height        | `<length-percentage>`                                                                                               | `3rem`                                                                       |
| --kit-button-md-font-size         | `<length-percentage>`                                                                                               | `0.9375rem`                                                                  |
| --kit-button-md-padding-inline    | `<length-percentage>`                                                                                               | `1rem`                                                                       |
| --kit-button-md-min-height        | `<length-percentage>`                                                                                               | `2.5rem`                                                                     |
| --kit-button-sm-font-size         | `<length-percentage>`                                                                                               | `0.875rem`                                                                   |
| --kit-button-sm-padding-inline    | `<length-percentage>`                                                                                               | `0.75rem`                                                                    |
| --kit-button-sm-min-height        | `<length-percentage>`                                                                                               | `2rem`                                                                       |
| --kit-button-spinner-size         | `<length-percentage>`                                                                                               | `1em`                                                                        |
| --kit-button-disabled-opacity     | `<number>`                                                                                                          | `var(--kit-disabled-opacity)`                                                |
| --kit-button-focus-outline-offset | `<length>`                                                                                                          | `2px`                                                                        |
| --kit-button-focus-outline-width  | `<length>`                                                                                                          | `2px`                                                                        |
| --kit-button-transition-timing    | `<easing-function>`                                                                                                 | `var(--kit-easing-standard)`                                                 |
| --kit-button-transition-duration  | `<time>`                                                                                                            | `var(--kit-duration-fast)`                                                   |
| --kit-button-line-height          | `<number>`                                                                                                          | `1`                                                                          |
| --kit-button-font-weight          | `<number>`                                                                                                          | `600`                                                                        |
| --kit-button-border-width         | `<length>`                                                                                                          | `var(--kit-border-width)`                                                    |
| --kit-button-gap                  | `<length-percentage>`                                                                                               | `0.375rem`                                                                   |
| --kit-button-radius               | `<length-percentage>{1,4} [ / <length-percentage>{1,4} ]? \| inherit \| initial \| unset \| revert \| revert-layer` | `var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md)))` |

## Verification and limits

Read [styling](../../guides/styling.md) and [compatibility](../compatibility.md) before relying on theme, portal, native-reset, CSP or SSR guarantees.
Local behavioral evidence is bounded to the tested native graph and platforms; a type check or successful CLI transaction does not certify arbitrary application behavior.

- [Owning tests/components/button-types.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/button-types.test.ts)
- [Owning tests/integration/button-install.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/integration/button-install.test.ts)
- [Owning tests/browser/button.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/button.spec.ts)
