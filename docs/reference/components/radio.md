# RadioGroup

Pinned Radio group and item with controlled string selection, fixed radial mark and native one-field forms.

## Install and compose

Installation ID: `radio`. Explicit requests and dependency closure remain separate.

```svelte
<script lang="ts">
  import { RadioGroup, RadioItem } from "$lib/components/ui";
</script>

<RadioGroup aria-label="Plan" name="plan" value="basic">
  <RadioItem id="basic" value="basic" />
  <label for="basic">Basic</label>
  <RadioItem id="pro" value="pro" />
  <label for="pro">Pro</label>
</RadioGroup>
```

## Public contract

Compose RadioGroup with labeled RadioItem children, each having a required stable string value.
Group binds string value (empty default); Group/Item bind actual HTMLElement refs.
Native orientation, loop, RTL, disabled, readonly and onValueChange own selection and tabstops.
Group children has no arguments; Item children receives checked; delegated child receives native props (and checked for Item).
Supply a fieldset/legend or explicit group name and separate item labels.
Group has no form prop; Item's button form does not associate the group field.
Exactly one named offscreen text field preserves the native successful-value/required policy and restores the per-instance initial value after uncanceled containing-form resets.
Empty-value arrows move focus without selecting; nonempty arrows/Home/End select.
Dynamic choice removal retains the selected string until caller/native selection changes it.
There is no numeric index, selection store or RadioIndicator.
Item geometry is 1rem with radial-gradient paint and `--kit-radio-radius` full-radius fallback.
Source boundary contrast remains a concern.

## Exports and installed assets

The [authoritative manifest](../../../registry/ui/radio.json) owns this inventory.

| Export            | Kind  | Local target     |
| ----------------- | ----- | ---------------- |
| `RadioGroup`      | value | `radio/index.ts` |
| `RadioItem`       | value | `radio/index.ts` |
| `RadioGroupProps` | type  | `radio/index.ts` |
| `RadioItemProps`  | type  | `radio/index.ts` |

Registry dependencies: `tokens`.
Npm requirements: `bits-ui` 2.19.5-svelte-ui-kit.2.

- [Authored radio/group.svelte](../../../registry/ui/radio/group.svelte)
- [Authored radio/item.svelte](../../../registry/ui/radio/item.svelte)
- [Authored radio/types.ts](../../../registry/ui/radio/types.ts)
- [Authored radio/index.ts](../../../registry/ui/radio/index.ts)
- [Managed radio CSS](../../../registry/styles/radio.css)

Source adaptations preserve the original named surface: `Radio`. The names here describe source attribution, not extra target aliases.

## Source styling and fallback contracts

These source observations retain exact fallback order. Application overrides and semantic defaults are distinct.

| Property           | Grammar                                                                                                             | Source fallback          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| --kit-radio-radius | `<length-percentage>{1,4} [ / <length-percentage>{1,4} ]? \| inherit \| initial \| unset \| revert \| revert-layer` | `var(--kit-radius-full)` |

## Verification and limits

Read [styling](../../guides/styling.md) and [compatibility](../compatibility.md) before relying on theme, portal, native-reset, CSP or SSR guarantees.
Local behavioral evidence is bounded to the tested native graph and platforms; a type check or successful CLI transaction does not certify arbitrary application behavior.

- [Owning tests/components/radio-css.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/radio-css.test.ts)
- [Owning tests/components/radio-parts.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/radio-parts.test.ts)
- [Owning tests/components/radio-types.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/radio-types.test.ts)
- [Owning tests/integration/radio-install.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/integration/radio-install.test.ts)
- [Owning tests/browser/radio-candidate.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/radio-candidate.spec.ts)
- [Owning tests/browser/radio-styles.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/radio-styles.spec.ts)
- [Owning tests/browser/radio.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/radio.spec.ts)
