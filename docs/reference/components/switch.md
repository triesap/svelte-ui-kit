# Switch

Thin pinned Bits Switch with owned Thumb and explicit state/ref bindings.

## Install and compose

Installation ID: `switch`. Explicit requests and dependency closure remain separate.

```svelte
<script lang="ts">
  import { Switch } from "$lib/components/ui";
</script>

<label for="updates">Receive updates</label>
<Switch id="updates" name="updates" />
```

## Public contract

A pinned Bits Switch Root owns one internal Thumb.
Bind checked (false default) and the actual HTMLElement ref; native callbacks, disabled/required/readonly, events and cancellation remain primitive-owned.
Child/children are excluded because the wrapper owns its markup.
Associate a visible label with the actual Root ID.
The wrapper withholds name/value from Root and supplies exactly one offscreen native checkbox for named form participation; capture initial checked per instance, resolve current input.form at reset time, and restore checked only after uncanceled resets.
Same-ID owner replacement is supported; teardown cancels pending timers/listeners.
Native empty-name and disabled policies remain intact.
Source track/thumb contrast is a known concern, not global accessibility certification.

## Exports and installed assets

The [authoritative manifest](../../../registry/ui/switch.json) owns this inventory.

| Export        | Kind  | Local target      |
| ------------- | ----- | ----------------- |
| `Switch`      | value | `switch.svelte`   |
| `SwitchProps` | type  | `switch.types.ts` |

Registry dependencies: `tokens`.
Npm requirements: `bits-ui` 2.19.5-svelte-ui-kit.2.

- [Authored switch.svelte](../../../registry/ui/switch.svelte)
- [Authored switch.types.ts](../../../registry/ui/switch.types.ts)
- [Managed switch CSS](../../../registry/styles/switch.css)

Source adaptations preserve the original named surface: `Switch`. The names here describe source attribution, not extra target aliases.

## Source styling and fallback contracts

These source observations retain exact fallback order. Application overrides and semantic defaults are distinct.

| Property                                | Grammar                                                                                                             | Source fallback                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| --kit-switch-track-background-unchecked | `<color>`                                                                                                           | `var(--kit-color-border-strong)`                                                 |
| --kit-switch-transition-duration        | `<time>`                                                                                                            | `var(--kit-duration-fast)`                                                       |
| --kit-switch-transition-timing          | `<easing-function>`                                                                                                 | `var(--kit-easing-standard)`                                                     |
| --kit-switch-track-background-checked   | `<color>`                                                                                                           | `var(--kit-color-primary)`                                                       |
| --kit-switch-thumb-background           | `<color>`                                                                                                           | `var(--kit-color-surface)`                                                       |
| --kit-switch-radius                     | `<length-percentage>{1,4} [ / <length-percentage>{1,4} ]? \| inherit \| initial \| unset \| revert \| revert-layer` | `var(--kit-radius-indicator, var(--kit-radius-default, var(--kit-radius-full)))` |
| --kit-switch-thumb-radius               | `<length-percentage>{1,4} [ / <length-percentage>{1,4} ]? \| inherit \| initial \| unset \| revert \| revert-layer` | `var(--kit-radius-full)`                                                         |

## Verification and limits

Read [styling](../../guides/styling.md) and [compatibility](../compatibility.md) before relying on theme, portal, native-reset, CSP or SSR guarantees.
Local behavioral evidence is bounded to the tested native graph and platforms; a type check or successful CLI transaction does not certify arbitrary application behavior.

- [Owning tests/components/switch-types.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/switch-types.test.ts)
- [Owning tests/integration/switch-install.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/integration/switch-install.test.ts)
- [Owning tests/browser/switch.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/switch.spec.ts)
