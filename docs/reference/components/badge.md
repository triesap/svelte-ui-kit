# Badge

Native text-bearing span presentation with source badge styles.

## Install and compose

Installation ID: `badge`. Explicit requests and dependency closure remain separate.

```svelte
<script lang="ts">
  import { Badge } from "$lib/components/ui";
</script>

<Badge>Draft</Badge>
```

## Public contract

A native span requires children and binds HTMLSpanElement ref.
Native attrs, classes/style, events and tabindex remain native; no variant/size/intent/action/disabled/loading/icon/compound API exists.
Render meaningful text and do not convey status by color alone.
No automatic status/live role or button behavior is added.
The source has ten declarations including inline-flex, indicator/default/full radius, padding, semantic surface-hover/text and inherited font; scoped native hidden is honored without removing until-found behavior.
Application themes and direct radius overrides remain app-owned.

## Exports and installed assets

The [authoritative manifest](../../../registry/ui/badge.json) owns this inventory.

| Export       | Kind  | Local target     |
| ------------ | ----- | ---------------- |
| `Badge`      | value | `badge.svelte`   |
| `BadgeProps` | type  | `badge.types.ts` |

Registry dependencies: `tokens`.
Npm requirements: none.

- [Authored badge.svelte](../../../registry/ui/badge.svelte)
- [Authored badge.types.ts](../../../registry/ui/badge.types.ts)
- [Managed badge CSS](../../../registry/styles/badge.css)

Source adaptations preserve the original named surface: `Badge`. The names here describe source attribution, not extra target aliases.

## Source styling and fallback contracts

These source observations retain exact fallback order. Application overrides and semantic defaults are distinct.

| Property           | Grammar                                                                                                             | Source fallback                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| --kit-badge-radius | `<length-percentage>{1,4} [ / <length-percentage>{1,4} ]? \| inherit \| initial \| unset \| revert \| revert-layer` | `var(--kit-radius-indicator, var(--kit-radius-default, var(--kit-radius-full)))` |

## Verification and limits

Read [styling](../../guides/styling.md) and [compatibility](../compatibility.md) before relying on theme, portal, native-reset, CSP or SSR guarantees.
Local behavioral evidence is bounded to the tested native graph and platforms; a type check or successful CLI transaction does not certify arbitrary application behavior.

- [Owning tests/components/badge-css.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/badge-css.test.ts)
- [Owning tests/components/badge-types.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/badge-types.test.ts)
- [Owning tests/integration/badge-install.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/integration/badge-install.test.ts)
- [Owning tests/browser/badge.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/badge.spec.ts)
