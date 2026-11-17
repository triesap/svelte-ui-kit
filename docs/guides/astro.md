# Astro applications

First follow the shared [CLI-host and archive preparation](../getting-started.md#choose-a-target), including
the application-owned corrected Svelte and Bits archives and their integrity
checks. The same native dependency requirements apply to Astro, SvelteKit and
standalone Svelte-library development; declaring ordinary upstream versions is
not proof of the qualified reset behavior. The commands below select an existing
Astro application; they do not scaffold it or install its dependencies.

Select a real Astro package with `--cwd`. Declare Svelte, Astro and
`@astrojs/svelte` in that package, with one statically supported Astro
configuration. A direct default object or imported `defineConfig` containing
`integrations: [svelte()]` is supported; computed roots/integrations, ambiguous
configurations and dynamic layouts refuse before mutation. Application modules
are parsed as data and are never executed by the generator.

Write canonical format-1 intent to `<uiDir>/_kit/kit.json` (the default UI directory is
`src/lib/components/ui`). For example, write `src/generated/ui/_kit/kit.json`:

<!-- documented-astro-intent:start -->

```json
{
  "schemaVersion": 1,
  "target": "astro",
  "uiDir": "src/generated/ui",
  "stylesDir": "src/styles",
  "layoutFile": "src/layouts/Layout.astro",
  "requested": []
}
```

<!-- documented-astro-intent:end -->

Use the ordinary `info`, `init --dry-run`, `init`, `add`, `sync` and `doctor`
commands described in [the CLI reference](../reference/cli.md). A missing layout
can be materialized. An existing layout must expose an unconditional default
slot; source-preserving frontmatter insertion imports kit, themes, then app CSS.
Named slots and unrelated layout code survive. Dynamic imports and ambiguous
rendering refuse rather than rewriting application code. Retired targetless format 1 and format 2 require
[clean-copy adoption](upgrading.md#canonical-format-adoption). Canonical locks
and retained format-3 journals authenticate their exact target;
read/no-change commands cannot repair a retained transaction.

Import generated Svelte exports into application components and hydrate those
components explicitly using Astro's `client:load` or another application-selected
directive. The kit supplies source and CSS, without an application runtime.
Application code owns server requests, island selection and content slots.

## A complete island

For the tested Node SSR example, declare Astro 7.4.4, `@astrojs/svelte` 9.1.2
and `@astrojs/node` 11.1.9, alongside the application-owned native archives and
`@internationalized/date` 3.12.4. These are tested pins, not a broad version promise.
The app owns `astro check`, strict `svelte-check`, TypeScript and build scripts.
Use `astro.config.ts`:

<!-- documented-astro-config:start -->

```ts
import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import node from "@astrojs/node";

export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [svelte()],
  devToolbar: { enabled: false },
  server: { host: "127.0.0.1" },
});
```

<!-- documented-astro-config:end -->

Before generation, an application-owned `src/layouts/Layout.astro` can provide
its slots and footer as follows. Init preserves this content and inserts the
ordered CSS imports:

<!-- documented-astro-layout:start -->

```astro
---
interface Props {
  title: string;
}
const { title } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
  </head>
  <body>
    <header>
      <slot name="banner" />
    </header>
    <div id="application-content">
      <slot />
    </div>
    <footer data-testid="layout-footer">Application-owned footer</footer>
  </body>
</html>
```

<!-- documented-astro-layout:end -->

Create `src/components/Island.svelte` with local relative imports:

<!-- documented-astro-island:start -->

```svelte
<script lang="ts">
  import { onMount } from "svelte";
  import {
    Button,
    MenuRoot,
    MenuTrigger,
    MenuPortal,
    MenuContent,
    MenuItem,
    TextField,
    DialogRoot,
    DialogTrigger,
    DialogPortal,
    DialogOverlay,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogClose,
  } from "../generated/ui/index.js";

  let { label }: { label: string } = $props();
  let hydrated = $state(false);
  let count = $state(0);
  let value = $state<string | undefined>("");
  let dialogMounted = $state(true);
  onMount(() => {
    hydrated = true;
  });
</script>

<section data-island={label} data-hydrated={hydrated}>
  <h2>{label} independent island</h2>
  <TextField name={label.toLowerCase()} label={`${label} name`} bind:value />
  <p data-testid={`${label}-value`}>{value}</p>
  <Button onclick={() => (count += 1)}>{label} increment</Button>
  <p data-testid={`${label}-count`}>{count}</p>
  <MenuRoot>
    <MenuTrigger>{label} actions</MenuTrigger>
    <MenuPortal>
      <MenuContent aria-label={`${label} actions`}>
        <MenuItem onSelect={() => (count += 1)}>Increment {label}</MenuItem>
      </MenuContent>
    </MenuPortal>
  </MenuRoot>
  {#if dialogMounted}
    <DialogRoot>
      <DialogTrigger>{label} dialog</DialogTrigger>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent>
          <DialogTitle>{label} details</DialogTitle>
          <DialogDescription>{label} application description</DialogDescription>
          <DialogClose>Close {label}</DialogClose>
          <Button onclick={() => (dialogMounted = false)}>
            Unmount {label} dialog
          </Button>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  {:else}
    <Button onclick={() => (dialogMounted = true)}>Mount {label} dialog</Button>
  {/if}
</section>
```

<!-- documented-astro-island:end -->

Keep every contextful compound composition inside this Svelte component.
Dialog/Menu parts and Field relationships do not span separate Astro islands;
callbacks, bindings and snippets remain inside Svelte, rather than being serialized
as Astro props. Pass serializable input such as `label` at the island boundary.
Each island below has its own state. The component reference's `$lib` alias is
SvelteKit-specific; `../generated/ui/index.js` names this app's actual output.
The simple Menu uses native dismissal; custom cancellation/return focus follows
the [Menu recipe](../reference/components/menu.md#custom-dismissal-and-keyboard-focus).

Create `src/pages/index.astro` and use the integrated layout:

<!-- documented-astro-page:start -->

```astro
---
import Layout from "../layouts/Layout.astro";
import Island from "../components/Island.svelte";
const value = Astro.url.searchParams.get("name") ?? "Server visitor";
---

<Layout title="Generated Astro consumer">
  <p slot="banner" data-testid="named-slot">
    Application-owned banner
  </p>
  <main>
    <h1>Generated Astro and Svelte islands</h1>
    <p data-testid="server-value">{value}</p>
    <p data-testid="style-order">Ordered kit, theme and application styles</p>
    <Island label="First" client:load />
    <Island label="Second" client:load />
  </main>
</Layout>
```

<!-- documented-astro-page:end -->

The generator can alternatively materialize a missing layout with a default
slot. This example supplies its named banner slot and footer explicitly. Import
kit/theme/app CSS through the layout as generated; do not hydrate each compound
part separately.

When all these application files and the intent are prepared, run `init --dry-run`, `init`, and `add` for each
of `button`, `field`, `menu` and `dialog` using the separate CLI host. Run
`doctor --strict`, the app's strict checks and `astro build`. Generation owns
source/CSS integration; it does not invent your application pages or interactions.

The maintained blueprint is `tests/fixtures/astro-consumer`. From a bootstrapped
checkout, run `pnpm run build`, then `pnpm run test:astro` for a separately
installed generated consumer, strict native checking/build, actual Node SSR,
two hydrated islands, ID/label relationships, focus, teardown, style order and
application slots. Its generated source, command transcripts, response HTML and
screenshot are retained under ignored `.artifacts/verification/astro-*`.
