# Checkbox

Thin pinned Bits Checkbox with fixed owned SVG and native form participation.

## Install and compose

Installation ID: `checkbox`. Explicit requests and dependency closure remain separate.

```svelte
<script lang="ts">
  import { Checkbox } from "$lib/components/ui";
</script>

<label for="terms">Accept terms</label>
<Checkbox id="terms" name="terms" required />
```

## Public contract

A pinned Bits Checkbox Root owns a fixed decorative 16×16 SVG.
Bindable checked and indeterminate are independent booleans, both false by default; callbacks retain exact native types/order.
Mixed activation selects checked and clears indeterminate.
Native readonly can deliver caller click events while refusing state changes.
Child/children, groups and public Indicator are excluded.
Associate a visible label with Root ID.
Exactly one named offscreen checkbox preserves actual name/value/form/required/disabled and indeterminate.
Uncanceled resets restore initial checked but preserve current indeterminate, as native controls do.
Resolve the current form owner at reset time and clean up listeners/timers.
The source 1rem geometry, fixed check path and selected/disabled/focus styles remain independent of label text.

## Exports and installed assets

The [authoritative manifest](../../../registry/ui/checkbox.json) owns this inventory.

| Export          | Kind  | Local target        |
| --------------- | ----- | ------------------- |
| `Checkbox`      | value | `checkbox.svelte`   |
| `CheckboxProps` | type  | `checkbox.types.ts` |

Registry dependencies: `tokens`.
Npm requirements: `bits-ui` 2.19.5-svelte-ui-kit.2.

- [Authored checkbox.svelte](../../../registry/ui/checkbox.svelte)
- [Authored checkbox.types.ts](../../../registry/ui/checkbox.types.ts)
- [Managed checkbox CSS](../../../registry/styles/checkbox.css)

Source adaptations preserve the original named surface: `Checkbox`. The names here describe source attribution, not extra target aliases.

## Source styling and fallback contracts

These source observations retain exact fallback order. Application overrides and semantic defaults are distinct.

| Property              | Grammar                                                                                                             | Source fallback                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| --kit-checkbox-radius | `<length-percentage>{1,4} [ / <length-percentage>{1,4} ]? \| inherit \| initial \| unset \| revert \| revert-layer` | `var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-sm)))` |

## Verification and limits

Read [styling](../../guides/styling.md) and [compatibility](../compatibility.md) before relying on theme, portal, native-reset, CSP or SSR guarantees.
Local behavioral evidence is bounded to the tested native graph and platforms; a type check or successful CLI transaction does not certify arbitrary application behavior.

- [Owning tests/components/checkbox-css.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/checkbox-css.test.ts)
- [Owning tests/components/checkbox-types.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/checkbox-types.test.ts)
- [Owning tests/integration/checkbox-install.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/integration/checkbox-install.test.ts)
- [Owning tests/browser/checkbox.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/checkbox.spec.ts)
