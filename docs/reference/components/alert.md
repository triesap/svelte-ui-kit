# Alert

Native assertive message presentation with application-owned content and source alert styles.

## Install and compose

Installation ID: `alert`. Explicit requests and dependency closure remain separate.

```svelte
<script lang="ts">
  import { Alert } from "$lib/components/ui";
</script>

<Alert>Changes could not be saved.</Alert>
```

## Public contract

A native div with required children, HTMLDivElement ref and fixed role=alert; the optional role prop only accepts alert.
This is an assertive/atomic live-region presentation, distinct from Alert Dialog and from nonurgent Status.
Native aria-live/atomic/relevant can explicitly override role defaults; no duplicated announcement or rewriting occurs.
The application owns meaningful message content and update timing; hide decorative duplicate icons/text with aria-hidden.
Retain the same node/ref through empty-to-message updates without moving focus.
No intent/size, dismiss parts, timer, queue or delivery callback exists.
Six source declarations preserve border-box, semantic border, surface/default/md radius, padding, raised background and text.
Chromium accessibility-tree evidence does not measure screen-reader speech.

## Exports and installed assets

The [authoritative manifest](../../../registry/ui/alert.json) owns this inventory.

| Export       | Kind  | Local target     |
| ------------ | ----- | ---------------- |
| `Alert`      | value | `alert.svelte`   |
| `AlertProps` | type  | `alert.types.ts` |

Registry dependencies: `tokens`.
Npm requirements: none.

- [Authored alert.svelte](../../../registry/ui/alert.svelte)
- [Authored alert.types.ts](../../../registry/ui/alert.types.ts)
- [Managed alert CSS](../../../registry/styles/alert.css)

Source adaptations preserve the original named surface: `Alert`. The names here describe source attribution, not extra target aliases.

## Source styling and fallback contracts

These source observations retain exact fallback order. Application overrides and semantic defaults are distinct.

| Property           | Grammar                                                                                                             | Source fallback                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| --kit-alert-radius | `<length-percentage>{1,4} [ / <length-percentage>{1,4} ]? \| inherit \| initial \| unset \| revert \| revert-layer` | `var(--kit-radius-surface, var(--kit-radius-default, var(--kit-radius-md)))` |

## Verification and limits

Read [styling](../../guides/styling.md) and [compatibility](../compatibility.md) before relying on theme, portal, native-reset, CSP or SSR guarantees.
Local behavioral evidence is bounded to the tested native graph and platforms; a type check or successful CLI transaction does not certify arbitrary application behavior.

- [Owning tests/components/alert-css.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/alert-css.test.ts)
- [Owning tests/components/alert-dialog-actions.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/alert-dialog-actions.test.ts)
- [Owning tests/components/alert-dialog-content.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/alert-dialog-content.test.ts)
- [Owning tests/components/alert-dialog-state.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/alert-dialog-state.test.ts)
- [Owning tests/components/alert-dialog-types.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/alert-dialog-types.test.ts)
- [Owning tests/components/alert-types.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/alert-types.test.ts)
- [Owning tests/integration/alert-dialog-install.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/integration/alert-dialog-install.test.ts)
- [Owning tests/integration/alert-dialog-ssr.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/integration/alert-dialog-ssr.test.ts)
- [Owning tests/integration/alert-install.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/integration/alert-install.test.ts)
- [Owning tests/browser/alert-dialog-candidate.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/alert-dialog-candidate.spec.ts)
- [Owning tests/browser/alert-dialog-hydration.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/alert-dialog-hydration.spec.ts)
- [Owning tests/browser/alert-dialog-interactions.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/alert-dialog-interactions.spec.ts)
- [Owning tests/browser/alert-dialog-themes.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/alert-dialog-themes.spec.ts)
- [Owning tests/browser/alert.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/alert.spec.ts)
