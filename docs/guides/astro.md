# Astro applications

Select a real Astro package with `--cwd`. Declare Svelte, Astro and
`@astrojs/svelte` in that package, with one statically supported Astro
configuration. A direct default object or imported `defineConfig` containing
`integrations: [svelte()]` is supported; computed roots/integrations, ambiguous
configurations and dynamic layouts refuse before mutation. Application modules
are parsed as data and are never executed by the generator.

Write v2 intent to `<uiDir>/_kit/kit.json` (the default UI directory is
`src/lib/components/ui`). For example:

```json
{
  "schemaVersion": 2,
  "target": "astro",
  "uiDir": "src/generated/ui",
  "stylesDir": "src/styles",
  "layoutFile": "src/layouts/Layout.astro",
  "requested": []
}
```

Use the ordinary `info`, `init --dry-run`, `init`, `add`, `sync` and `doctor`
commands described in [the CLI reference](../reference/cli.md). A missing layout
can be materialized. An existing layout must expose an unconditional default
slot; source-preserving frontmatter insertion imports kit, themes, then app CSS.
Named slots and unrelated layout code survive. Dynamic imports and ambiguous
rendering refuse rather than rewriting application code. V1 intent is never
silently upgraded. V2 locks and retained journals authenticate their exact target;
read/no-change commands cannot repair a retained transaction.

Import generated Svelte exports into application components and hydrate those
components explicitly using Astro's `client:load` or another application-selected
directive. The kit supplies source and CSS, without an application runtime.
Application code owns server requests, island selection and content slots.

The maintained blueprint is `tests/fixtures/astro-consumer`. From a bootstrapped
checkout, run `pnpm run build`, then `pnpm run test:astro` for a separately
installed generated consumer, strict native checking/build, actual Node SSR,
two hydrated islands, ID/label relationships, focus, teardown, style order and
application slots. Its generated source, command transcripts, response HTML and
screenshot are retained under ignored `.artifacts/verification/astro-*`.
