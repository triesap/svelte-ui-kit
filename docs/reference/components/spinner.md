# Spinner

Native decorative and status loading presentation.

## Install and compose

Installation ID: `spinner`. Explicit requests and dependency closure remain separate.

```svelte
<script lang="ts">
  import { Spinner } from "$lib/components/ui";
</script>

<Spinner label="Saving" />
```

## Public contract

An empty native span renders the owned `kit-spinner-mark` and `kit-spinner-label`.
Status mode defaults to role=status and label Loading; decorative mode sets aria-hidden and excludes label.
There is no bindable ref, children, primitive, ID allocator or size/variant API.
Types derive from SvelteHTMLElements without widening native attributes.
Circular geometry uses `--kit-spinner-radius` with `var(--kit-radius-full)` independently of broad radius changes.
The reduced-motion rule stops animation; meaningful busy feedback belongs to the surrounding application.

## Exports and installed assets

The [authoritative manifest](../../../registry/ui/spinner.json) owns this inventory.

| Export         | Kind  | Local target       |
| -------------- | ----- | ------------------ |
| `Spinner`      | value | `spinner.svelte`   |
| `SpinnerMode`  | type  | `spinner.types.ts` |
| `SpinnerProps` | type  | `spinner.types.ts` |

Registry dependencies: `tokens`.
Npm requirements: none.

- [Authored spinner.svelte](../../../registry/ui/spinner.svelte)
- [Authored spinner.types.ts](../../../registry/ui/spinner.types.ts)
- [Managed spinner CSS](../../../registry/styles/spinner.css)

Source adaptations preserve the original named surface: `Spinner`, `SpinnerMode`. The names here describe source attribution, not extra target aliases.

## Source styling and fallback contracts

These source observations retain exact fallback order. Application overrides and semantic defaults are distinct.

| Property                         | Grammar                                                                                                             | Source fallback                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| --kit-spinner-inline-size        | `<length-percentage>`                                                                                               | `1em`                                               |
| --kit-spinner-block-size         | `<length-percentage>`                                                                                               | `1em`                                               |
| --kit-spinner-border-width       | `<length>`                                                                                                          | `0.125em`                                           |
| --kit-spinner-track-color        | `<color>`                                                                                                           | `color-mix(in srgb, currentColor 20%, transparent)` |
| --kit-spinner-color              | `<color>`                                                                                                           | `currentColor`                                      |
| --kit-spinner-animation-duration | `<time>`                                                                                                            | `900ms`                                             |
| --kit-spinner-radius             | `<length-percentage>{1,4} [ / <length-percentage>{1,4} ]? \| inherit \| initial \| unset \| revert \| revert-layer` | `var(--kit-radius-full)`                            |

## Verification and limits

Read [styling](../../guides/styling.md) and [compatibility](../compatibility.md) before relying on theme, portal, native-reset, CSP or SSR guarantees.
Local behavioral evidence is bounded to the tested native graph and platforms; a type check or successful CLI transaction does not certify arbitrary application behavior.

- [Owning tests/components/spinner-contract.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/spinner-contract.test.ts)
- [Owning tests/integration/spinner-install.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/integration/spinner-install.test.ts)
- [Owning tests/browser/spinner.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/spinner.spec.ts)
