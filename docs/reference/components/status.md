# Status

Native paragraph feedback with source role politeness atomic options and source status styles.

## Install and compose

Installation ID: `status`. Explicit requests and dependency closure remain separate.

```svelte
<script lang="ts">
  import { Status } from "$lib/components/ui";
</script>

<Status>Changes saved.</Status>
```

## Public contract

A native paragraph with required children, HTMLParagraphElement ref, role status/alert (status default), politeness polite/assertive (polite default), and boolean atomic (true default).
Explicit native aria-live/atomic overrides recipe options; undefined uses the option, null omits the attr and leaves role-implied behavior.
No role-none, severity/size, queue, timer or delivery service exists.
Use inline paragraph content, meaningful messages and aria-hidden decorative duplicates.
Retain node/ref and application focus across updates.
Five declarations preserve margin=0 and four source status color/font-size/font-weight/line-height hooks.
Browser accessibility-tree observations do not promise actual speech across screen readers.

## Exports and installed assets

The [authoritative manifest](../../../registry/ui/status.json) owns this inventory.

| Export             | Kind  | Local target      |
| ------------------ | ----- | ----------------- |
| `Status`           | value | `status.svelte`   |
| `StatusProps`      | type  | `status.types.ts` |
| `StatusRole`       | type  | `status.types.ts` |
| `StatusPoliteness` | type  | `status.types.ts` |

Registry dependencies: `tokens`.
Npm requirements: none.

- [Authored status.svelte](../../../registry/ui/status.svelte)
- [Authored status.types.ts](../../../registry/ui/status.types.ts)
- [Managed status CSS](../../../registry/styles/status.css)

Source adaptations preserve the original named surface: `Status`, `StatusPoliteness`, `StatusRole`. The names here describe source attribution, not extra target aliases.

## Source styling and fallback contracts

These source observations retain exact fallback order. Application overrides and semantic defaults are distinct.

| Property                 | Grammar                           | Source fallback         |
| ------------------------ | --------------------------------- | ----------------------- |
| --kit-status-color       | `<color>`                         | `var(--kit-color-text)` |
| --kit-status-font-size   | `<length-percentage>`             | `1rem`                  |
| --kit-status-font-weight | `<number>`                        | `400`                   |
| --kit-status-line-height | `<number> \| <length-percentage>` | `1.4`                   |

## Verification and limits

Read [styling](../../guides/styling.md) and [compatibility](../compatibility.md) before relying on theme, portal, native-reset, CSP or SSR guarantees.
Local behavioral evidence is bounded to the tested native graph and platforms; a type check or successful CLI transaction does not certify arbitrary application behavior.

- [Owning tests/components/status-css.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/status-css.test.ts)
- [Owning tests/components/status-types.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/status-types.test.ts)
- [Owning tests/integration/status-install.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/integration/status-install.test.ts)
- [Owning tests/browser/status.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/status.spec.ts)
