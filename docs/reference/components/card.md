# Card

Native sectioning surface with application-owned content and source card styles.

## Install and compose

Installation ID: `card`. Explicit requests and dependency closure remain separate.

```svelte
<script lang="ts">
  import { Card } from "$lib/components/ui";
</script>

<Card
  ><h2>Account</h2>
  <p>Manage your account.</p></Card
>
```

## Public contract

A native section requires children and binds actual HTMLElement ref.
Compose application headings, content, footer, controls or nested cards directly; no CardHeader/Title/Content/Footer, variants or business state exist.
A distinct document section needs appropriate heading/name; an unnamed section remains native without imposed landmark roles or automatic IDs.
Caller controls, event cancellation, forms, attributes and teardown remain native.
Seven source declarations preserve border-box, semantic border, surface/default/lg radius, 1rem padding, raised background, text and small shadow.
Nested theme overrides remain independent.

## Exports and installed assets

The [authoritative manifest](../../../registry/ui/card.json) owns this inventory.

| Export      | Kind  | Local target    |
| ----------- | ----- | --------------- |
| `Card`      | value | `card.svelte`   |
| `CardProps` | type  | `card.types.ts` |

Registry dependencies: `tokens`.
Npm requirements: none.

- [Authored card.svelte](../../../registry/ui/card.svelte)
- [Authored card.types.ts](../../../registry/ui/card.types.ts)
- [Managed card CSS](../../../registry/styles/card.css)

Source adaptations preserve the original named surface: `Card`. The names here describe source attribution, not extra target aliases.

## Source styling and fallback contracts

These source observations retain exact fallback order. Application overrides and semantic defaults are distinct.

| Property          | Grammar                                                                                                             | Source fallback                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| --kit-card-radius | `<length-percentage>{1,4} [ / <length-percentage>{1,4} ]? \| inherit \| initial \| unset \| revert \| revert-layer` | `var(--kit-radius-surface, var(--kit-radius-default, var(--kit-radius-lg)))` |

## Verification and limits

Read [styling](../../guides/styling.md) and [compatibility](../compatibility.md) before relying on theme, portal, native-reset, CSP or SSR guarantees.
Local behavioral evidence is bounded to the tested native graph and platforms; a type check or successful CLI transaction does not certify arbitrary application behavior.

- [Owning tests/components/card-css.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/card-css.test.ts)
- [Owning tests/components/card-types.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/card-types.test.ts)
- [Owning tests/integration/card-install.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/integration/card-install.test.ts)
- [Owning tests/browser/card.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/card.spec.ts)
