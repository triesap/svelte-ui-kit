# Avatar

Native image avatar with accessible optional loading and failure fallback.

## Install and compose

Installation ID: `avatar`. Explicit requests and dependency closure remain separate.

```svelte
<script lang="ts">
  import { Avatar } from "$lib/components/ui";
</script>

<Avatar src="/profile.jpg" alt="Profile of Ada" />
```

## Public contract

A native image requires string src/alt, accepts optional no-argument fallback Snippet and binds the actual HTMLImageElement ref.
Native srcset/sizes/loading/cross-origin/referrer hints and typed load/error events remain intact; Svelte event currentTarget is Element, narrowed for image properties.
No children, replacement element, size/variant, delay, loading controller or Bits preloader exists.
A noninteractive frame owns loading/loaded/error and fallback.
SSR begins loading; src/srcset/sizes key the request, and stale detached-image events cannot settle state or invoke current callbacks.
Current load/error settle state before one caller callback; already-complete hydration adds no synthetic callback.
Loading/error fallback has one image role/name from meaningful alt; image/fallback descendants are hidden from duplicate naming.
Empty alt is decorative.
Keep fallback noninteractive.
Image visibility, not display removal, preserves lazy-request geometry; native hidden remains effective and until-found stays native.
Frame shrink-wraps caller image dimensions.
Source image is 2.5rem square, cover-fit and full radius; two fallback background/color hooks add muted presentation without motion.
Pinned Svelte SSR emits inline image event recorder attributes before hydration and replays a captured event once; this is not strict-CSP certification.

## Exports and installed assets

The [authoritative manifest](../../../registry/ui/avatar.json) owns this inventory.

| Export        | Kind  | Local target      |
| ------------- | ----- | ----------------- |
| `Avatar`      | value | `avatar.svelte`   |
| `AvatarProps` | type  | `avatar.types.ts` |

Registry dependencies: `tokens`.
Npm requirements: none.

- [Authored avatar.svelte](../../../registry/ui/avatar.svelte)
- [Authored avatar.types.ts](../../../registry/ui/avatar.types.ts)
- [Managed avatar CSS](../../../registry/styles/avatar.css)

Source adaptations preserve the original named surface: `Avatar`. The names here describe source attribution, not extra target aliases.

## Source styling and fallback contracts

These source observations retain exact fallback order. Application overrides and semantic defaults are distinct.

| Property                         | Grammar                                                                                                             | Source fallback                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| --kit-avatar-radius              | `<length-percentage>{1,4} [ / <length-percentage>{1,4} ]? \| inherit \| initial \| unset \| revert \| revert-layer` | `var(--kit-radius-full)`         |
| --kit-avatar-fallback-background | `<color>`                                                                                                           | `var(--kit-color-surface-hover)` |
| --kit-avatar-fallback-color      | `<color>`                                                                                                           | `var(--kit-color-text-muted)`    |

## Verification and limits

Read [styling](../../guides/styling.md) and [compatibility](../compatibility.md) before relying on theme, portal, native-reset, CSP or SSR guarantees.
Local behavioral evidence is bounded to the tested native graph and platforms; a type check or successful CLI transaction does not certify arbitrary application behavior.

- [Owning tests/components/avatar-css.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/avatar-css.test.ts)
- [Owning tests/components/avatar-types.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/avatar-types.test.ts)
- [Owning tests/integration/avatar-install.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/integration/avatar-install.test.ts)
- [Owning tests/browser/avatar.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/avatar.spec.ts)
