# RouterLink

Optional native SvelteKit link recipe reusing Anchor source and design.

## Install and compose

Installation ID: `router-link`. Explicit requests and dependency closure remain separate.

```svelte
<script lang="ts">
  import { RouterLink } from "$lib/components/ui";
</script>

<RouterLink href="/account">Account</RouterLink>
```

## Public contract

An optional SvelteKit recipe over local Anchor with exactly AnchorProps and native HTMLAnchorElement ref.
The application resolves href, including $app/paths resolve when appropriate, and may pass native SvelteKit preload/reload/replace/no-scroll attributes.
It is not a client-side router runtime, active-route store, automatic base-path resolver, route guard or nested link.
Native navigation, events, cancellation, target/rel/download and meaningful children remain intact.
Its registry dependency is Anchor; shared styles arrive through that closure.

## Exports and installed assets

The [authoritative manifest](../../../registry/ui/router-link.json) owns this inventory.

| Export            | Kind  | Local target           |
| ----------------- | ----- | ---------------------- |
| `RouterLink`      | value | `router-link.svelte`   |
| `RouterLinkProps` | type  | `router-link.types.ts` |

Registry dependencies: `anchor`.
Npm requirements: none.

- [Authored router-link.svelte](../../../registry/ui/router-link.svelte)
- [Authored router-link.types.ts](../../../registry/ui/router-link.types.ts)

Source adaptations preserve the original named surface: `RouterLink`. The names here describe source attribution, not extra target aliases.

## Verification and limits

Read [styling](../../guides/styling.md) and [compatibility](../compatibility.md) before relying on theme, portal, native-reset, CSP or SSR guarantees.
Local behavioral evidence is bounded to the tested native graph and platforms; a type check or successful CLI transaction does not certify arbitrary application behavior.

- [Owning tests/components/router-link-types.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/router-link-types.test.ts)
- [Owning tests/integration/router-link-install.test.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/integration/router-link-install.test.ts)
- [Owning tests/browser/router-link.spec.ts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/router-link.spec.ts)
