# Separator

Native meaningful or decorative separator with source orientation and semantic border geometry.

## Install and compose

Installation ID: `separator`. Explicit requests and dependency closure remain separate.

```svelte
<script lang="ts">
  import { Separator } from "$lib/components/ui";
</script>

<Separator />
```

## Public contract

A native div with orientation horizontal/vertical (horizontal default), HTMLDivElement ref and no children.
Semantic mode defaults role=separator with owned aria-orientation; decorative=true uses role=none and aria-hidden=true.
Contradictory role/orientation/hidden attributes are rejected rather than dropped.
Native caller attrs/events/style/ref remain intact without interactive behavior.
Source geometry uses semantic border color; vertical separators need an actual containing block height.
The baseline border on white and some custom dark combinations are below 3:1; no automatic palette redesign or universal nontext-contrast claim is made.

## Exports and installed assets

The [authoritative manifest](../../../registry/ui/separator.json) owns this inventory.

| Export                 | Kind  | Local target         |
| ---------------------- | ----- | -------------------- |
| `Separator`            | value | `separator.svelte`   |
| `SeparatorProps`       | type  | `separator.types.ts` |
| `SeparatorOrientation` | type  | `separator.types.ts` |

Registry dependencies: `tokens`.
Npm requirements: none.

- [Authored separator.svelte](../../../registry/ui/separator.svelte)
- [Authored separator.types.ts](../../../registry/ui/separator.types.ts)
- [Managed separator CSS](../../../registry/styles/separator.css)

Source adaptations preserve the original named surface: `Separator`, `SeparatorOrientation`. The names here describe source attribution, not extra target aliases.

## Verification and limits

Read [styling](../../guides/styling.md) and [compatibility](../compatibility.md) before relying on theme, portal, native-reset, CSP or SSR guarantees.
Local behavioral evidence is bounded to the tested native graph and platforms; a type check or successful CLI transaction does not certify arbitrary application behavior.

- [Owning tests/components/separator-css.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/separator-css.test.ts)
- [Owning tests/components/separator-types.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/separator-types.test.ts)
- [Owning tests/integration/separator-install.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/integration/separator-install.test.ts)
- [Owning tests/browser/separator.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/separator.spec.ts)
