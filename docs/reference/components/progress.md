# Progress

Native numeric progress bounds and indeterminate state with source progress styles.

## Install and compose

Installation ID: `progress`. Explicit requests and dependency closure remain separate.

```svelte
<script lang="ts">
  import { Progress } from "$lib/components/ui";
</script>

<Progress aria-label="Upload" value={40} max={100} />
```

## Public contract

A native progress element binds HTMLProgressElement ref, accepts number|null value/max, defaults max=100, has no children API and permits only role=progressbar.
Omitting/null value is truly indeterminate, including initial SSR and transitions; bounded native numbers and invalid/nonfinite values follow browser semantics, not an app task store or clamping engine.
The wrapper uses the native case-insensitive VALUE attribute path and removes absent value after updates to avoid pinned Svelte's lowercase IDL setter converting omission to zero.
Native attrs/name/labels remain app-owned; supply a real accessible label and keep task text separate.
Progress is read-only and contributes no successful form field.
Source track/value styles and indicator/default/full radius remain; native engine-specific paint differs, and Chromium results do not qualify Firefox/WebKit painting or screen-reader speech.

## Exports and installed assets

The [authoritative manifest](../../../registry/ui/progress.json) owns this inventory.

| Export          | Kind  | Local target        |
| --------------- | ----- | ------------------- |
| `Progress`      | value | `progress.svelte`   |
| `ProgressProps` | type  | `progress.types.ts` |

Registry dependencies: `tokens`.
Npm requirements: none.

- [Authored progress.svelte](../../../registry/ui/progress.svelte)
- [Authored progress.types.ts](../../../registry/ui/progress.types.ts)
- [Managed progress CSS](../../../registry/styles/progress.css)

Source adaptations preserve the original named surface: `Progress`. The names here describe source attribution, not extra target aliases.

## Source styling and fallback contracts

These source observations retain exact fallback order. Application overrides and semantic defaults are distinct.

| Property              | Grammar                                                                                                             | Source fallback                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| --kit-progress-radius | `<length-percentage>{1,4} [ / <length-percentage>{1,4} ]? \| inherit \| initial \| unset \| revert \| revert-layer` | `var(--kit-radius-indicator, var(--kit-radius-default, var(--kit-radius-full)))` |

## Verification and limits

Read [styling](../../guides/styling.md) and [compatibility](../compatibility.md) before relying on theme, portal, native-reset, CSP or SSR guarantees.
Local behavioral evidence is bounded to the tested native graph and platforms; a type check or successful CLI transaction does not certify arbitrary application behavior.

- [Owning tests/components/progress-css.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/progress-css.test.ts)
- [Owning tests/components/progress-types.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/progress-types.test.ts)
- [Owning tests/integration/progress-install.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/integration/progress-install.test.ts)
- [Owning tests/browser/progress.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/progress.spec.ts)
