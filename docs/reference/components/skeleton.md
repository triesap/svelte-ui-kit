# Skeleton

Empty native decorative loading placeholder with source surface and radius styles.

## Install and compose

Installation ID: `skeleton`. Explicit requests and dependency closure remain separate.

```svelte
<script lang="ts">
  import { Skeleton } from "$lib/components/ui";
</script>

<Skeleton style="inline-size: 12rem; block-size: 1rem" />
```

## Public contract

An empty native decorative span with actual HTMLSpanElement ref and owned aria-hidden=true.
No children, role/status/busy, label, focus state, timer or loading API exists.
The application owns its loading region and meaningful status outside this decorative placeholder.
Four source declarations preserve geometry, background and surface/default/sm radius; native hidden including until-found remains supported.
No motion is introduced.
Low decorative contrast is not a readable-message contract.

## Exports and installed assets

The [authoritative manifest](../../../registry/ui/skeleton.json) owns this inventory.

| Export          | Kind  | Local target        |
| --------------- | ----- | ------------------- |
| `Skeleton`      | value | `skeleton.svelte`   |
| `SkeletonProps` | type  | `skeleton.types.ts` |

Registry dependencies: `tokens`.
Npm requirements: none.

- [Authored skeleton.svelte](../../../registry/ui/skeleton.svelte)
- [Authored skeleton.types.ts](../../../registry/ui/skeleton.types.ts)
- [Managed skeleton CSS](../../../registry/styles/skeleton.css)

Source adaptations preserve the original named surface: `Skeleton`. The names here describe source attribution, not extra target aliases.

## Source styling and fallback contracts

These source observations retain exact fallback order. Application overrides and semantic defaults are distinct.

| Property              | Grammar                                                                                                             | Source fallback                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| --kit-skeleton-radius | `<length-percentage>{1,4} [ / <length-percentage>{1,4} ]? \| inherit \| initial \| unset \| revert \| revert-layer` | `var(--kit-radius-surface, var(--kit-radius-default, var(--kit-radius-sm)))` |

## Verification and limits

Read [styling](../../guides/styling.md) and [compatibility](../compatibility.md) before relying on theme, portal, native-reset, CSP or SSR guarantees.
Local behavioral evidence is bounded to the tested native graph and platforms; a type check or successful CLI transaction does not certify arbitrary application behavior.

- [Owning tests/components/skeleton-css.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/skeleton-css.test.ts)
- [Owning tests/components/skeleton-types.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/skeleton-types.test.ts)
- [Owning tests/integration/skeleton-install.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/integration/skeleton-install.test.ts)
- [Owning tests/browser/skeleton.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/skeleton.spec.ts)
