# Anchor

Native typed link presentation with source target and rel safety defaults.

## Install and compose

Installation ID: `anchor`. Explicit requests and dependency closure remain separate.

```svelte
<script lang="ts">
  import { Anchor } from "$lib/components/ui";
</script>

<Anchor href="/account">Account</Anchor>
```

## Public contract

A native anchor with required href and children, actual HTMLAnchorElement ref and native attributes/events/classes.
AnchorTarget preserves native browsing contexts including caller-named contexts.
Navigation, download, target/rel and SvelteKit link attributes remain application-owned; there is no role-button, disabled/loading/action API, router state or polymorphic replacement.
Preserve native activation/cancellation and meaningful link content.
For target=_blank, omitted/null rel defaults to noopener noreferrer; an explicit rel, including empty string, is preserved reactively.
Other targets omit rel by default.
No automatic external-link icon is added.
Opening a new context and its security policy are explicit app choices.

## Exports and installed assets

The [authoritative manifest](../../../registry/ui/anchor.json) owns this inventory.

| Export         | Kind  | Local target      |
| -------------- | ----- | ----------------- |
| `Anchor`       | value | `anchor.svelte`   |
| `AnchorProps`  | type  | `anchor.types.ts` |
| `AnchorTarget` | type  | `anchor.types.ts` |

Registry dependencies: `tokens`.
Npm requirements: none.

- [Authored anchor.svelte](../../../registry/ui/anchor.svelte)
- [Authored anchor.types.ts](../../../registry/ui/anchor.types.ts)
- [Managed anchor CSS](../../../registry/styles/anchor.css)

Source adaptations preserve the original named surface: `Anchor`, `AnchorTarget`. The names here describe source attribution, not extra target aliases.

## Source styling and fallback contracts

These source observations retain exact fallback order. Application overrides and semantic defaults are distinct.

| Property                               | Grammar                                    | Source fallback               |
| -------------------------------------- | ------------------------------------------ | ----------------------------- |
| --kit-anchor-color                     | `<color>`                                  | `var(--kit-color-link)`       |
| --kit-anchor-text-decoration-color     | `<color>`                                  | `currentColor`                |
| --kit-anchor-text-decoration-line      | `<text-decoration-line>`                   | `underline`                   |
| --kit-anchor-text-decoration-thickness | `<length-percentage> \| from-font \| auto` | `from-font`                   |
| --kit-anchor-text-underline-offset     | `<length-percentage> \| auto`              | `0.12em`                      |
| --kit-anchor-color-hover               | `<color>`                                  | `var(--kit-color-link-hover)` |
| --kit-anchor-focus-outline-width       | `<length>`                                 | `0.125rem`                    |
| --kit-anchor-focus-outline-color       | `<color>`                                  | `var(--kit-focus-ring)`       |
| --kit-anchor-focus-outline-offset      | `<length>`                                 | `0.125rem`                    |

## Verification and limits

Read [styling](../../guides/styling.md) and [compatibility](../compatibility.md) before relying on theme, portal, native-reset, CSP or SSR guarantees.
Local behavioral evidence is bounded to the tested native graph and platforms; a type check or successful CLI transaction does not certify arbitrary application behavior.

- [Owning tests/components/anchor-css.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/anchor-css.test.ts)
- [Owning tests/components/anchor-lint-boundary.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/anchor-lint-boundary.test.ts)
- [Owning tests/components/anchor-types.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/anchor-types.test.ts)
- [Owning tests/integration/anchor-install.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/integration/anchor-install.test.ts)
- [Owning tests/browser/anchor.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/anchor.spec.ts)
