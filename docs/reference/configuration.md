# Configuration and generated layout

All paths are relative to one selected application or library package. `--cwd`
selects that package; the CLI does not scan and mutate every workspace member or
execute application configuration/scripts to discover it. Configuration is
validated against the [v1 schema](../../schema/v1/kit.schema.json).

## Desired configuration

The default configuration is `src/lib/components/ui/_kit/kit.json`. It stores
`schemaVersion`, the `builtin` registry, integration mappings and **explicit root
requests**, rather than replacing requests with dependency closure.

| Field           | Meaning                                                                  |
| --------------- | ------------------------------------------------------------------------ |
| `schemaVersion` | Legacy SvelteKit format 1; explicit target format 2 is described below.  |
| `registry`      | Built-in registry only; currently `builtin`.                             |
| `uiDir`         | Local source and root export directory; default `src/lib/components/ui`. |
| `stylesDir`     | Aggregate and application stylesheet directory; default `src/styles`.    |
| `layoutFile`    | Explicit supported root layout or statically detected layout.            |
| `requested`     | Unique installable root IDs deliberately selected by the app.            |

Unknown fields, duplicate requests, unsupported versions, unsafe/overlapping paths
and ambiguous project identity fail visibly. Framework, CLI, registry, item and
schema versions have independent meanings; a framework bump is not a migration.

## Workspace catalog declarations

Dependency evidence accepts `catalog:` and `catalog:name` in the selected
package's dependency declarations. The nearest owning `pnpm-workspace.yaml`
must prove membership; lookup never crosses a nested Git owner or borrows an
unrelated workspace. Default and named catalogs are parsed as data. Duplicate
keys, aliases, tags, included catalog files, missing values and recursive catalog
references produce actionable nonmutating diagnostics.

Resolved declarations retain the ordinary strict installed-version, peer and
native archive authentication checks. Catalog values do not establish an
installation. Native `file:` paths are relative to the workspace file under
[pnpm semantics](https://pnpm.io/catalogs); a descendant package must explicitly
declare its own authenticated local archive instead of reinterpreting a workspace
archive as package-local. No package manager, package script or executable
configuration is evaluated to resolve catalogs.

Planning captures the raw manifest preimage and the catalog/workspace physical
input fingerprint. Apply revalidates it before coordination and again under the
held write authority. Changes require a fresh plan; neither the selected package
nor its workspace is rewritten during discovery or refusal.

## Custom mapping

### Explicit target schema

The independent [v2 target schema](../../schema/v2/kit.schema.json) defines
explicit target discovery and integration intent. The CLI generates v1 SvelteKit
and v2 SvelteKit, Astro and standalone Svelte-library installations.
Existing v1 defaults, custom paths and unknown-field
refusals remain unchanged; no automatic schema or ownership migration occurs.

V2 requires `schemaVersion: 2` and an explicit `target`. Common `uiDir`,
`stylesDir`, `requested`, `toolVersion` and `registry` fields retain their v1
meanings. Framework, registry, item, lock and configuration revisions are
independent. The target mapping is a closed union:

| Target           | Required integration mapping                                   | Package evidence                                                                             |
| ---------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `sveltekit`      | `layoutFile` ending in `.svelte`                               | Svelte and actual `@sveltejs/kit`; unambiguous static Svelte configuration                   |
| `astro`          | Explicit `layoutFile` ending in `.astro`                       | Svelte, `astro`, `@astrojs/svelte` and one statically supported Astro configuration          |
| `svelte-library` | Explicit `styleEntry` ending in `.css`; `layoutFile` forbidden | Svelte peer, typed Svelte-condition package entry and an export of the configured stylesheet |

Astro discovery supports a direct default object or imported
`defineConfig({ integrations: [svelte()] })` using the direct default import
from `@astrojs/svelte`. Configuration is parsed with TypeScript and never loaded.
Computed factories, aliases to mutable configuration, spreads, duplicate keys,
multiple integrations, dynamic options and a different package root require a
manual supported form. New configuration examples use `astro.config.ts`.

A library cannot declare an application framework, borrow an application layout
or supply contradictory/escaping entry declarations. Its stylesheet entry will
integrate kit, theme and application styles in order; the consumer owns package
build/export metadata. The current discovery API never rewrites `package.json`.
Target evidence captures package/config bytes, identities, modes and candidate
absence immutably. Target integration contracts are `layout-v1`,
`astro-layout-v1` and `library-styles-v1`. All three contracts produce
target-bound plans, locks and recovery journals. A library records its real
stylesheet entry and never borrows a layout field. See
[Astro applications](../guides/astro.md) and
[Svelte libraries](../guides/svelte-library.md).

### Supported SvelteKit configuration

Both v1 and v2 application paths require stable Kit2-only declarations and
independently matching installed metadata when present. Planning captures every
Svelte/Vite configuration candidate and its absence. A present Vite configuration
must be one regular bounded ESM file with a literal default object or imported
`defineConfig({ plugins: [sveltekit()] })`. Even an empty options object changes
Kit2's configuration source, so all plugin arguments refuse. Dynamic factories,
extra plugins, relocated roots, competing files and CJS/CTS forms require an
explicit supported form. A later file appearance or change invalidates apply
before ordinary writes. No application configuration executes during discovery.

Kit2 discovers `svelte.config.js` and `svelte.config.ts`; present `.mjs`/`.cjs`
files refuse instead of supplying a mapping the framework would ignore. A `.ts`
configuration requires Kit>=2.23.0, and `files.src` defaults require Kit>=2.29.0.
The captured installation must support the feature; when explicitly absent,
every declared range must stay within that feature floor and Kit2. Literal
`files.src` supplies missing routes/lib defaults while explicit overrides win.
Route extensions must remain the default or literal `[".svelte"]`. Configuration
properties that produce a prototype refuse independently of explicit intent.

### Existing SvelteKit mapping

Before initialization, create `app/ui/_kit/kit.json` in the selected application:

<!-- documented-custom-mapping:start -->

```json
{
  "schemaVersion": 1,
  "registry": "builtin",
  "uiDir": "app/ui",
  "stylesDir": "assets/styles",
  "layoutFile": "src/routes/+layout.svelte",
  "requested": []
}
```

<!-- documented-custom-mapping:end -->

Exactly one discovered `_kit/kit.json` may identify the installation; its location
must agree with `uiDir`. Discovery is deterministic and read-only, excludes VCS,
dependencies/build outputs and nested package roots, and never follows symlinks.
No candidate uses the default bootstrap location. Multiple, malformed or
mislocated candidates fail rather than selecting one by accident.

## Installed observations

The [lock schema](../../schema/v1/kit-lock.schema.json) owns installed lineage:
requested versus transitive origin, registry/item identities, file/CSS cohort
owners, baseline hashes and integration contracts. Commit this tool-managed
semantic metadata. Do not edit hashes to hide local work. Ephemeral coordination,
staging and journals are distinct recovery evidence, not desired configuration.

## Source, exports and styles

Simple components use kebab-case files; compound families have directories and
flat PascalCase root exports. Generated wrappers import local siblings and native
APIs, never CLI internals or a styled kit runtime. The root barrel's managed
regions preserve unrelated exports. The tool does not create a parent components
barrel merely to imitate another framework.

`kit.css` aggregates managed component blocks. `themes.css` and `app.css` remain
application-owned. Supported layout integration imports kit, themes, then app CSS
without replacing existing route rendering or unrelated layout code. Unsupported,
dynamic or ambiguous integration stops with an actionable manual step.
See [styling](../guides/styling.md), [upgrading](../guides/upgrading.md) and
[recovery](../guides/recovery.md).
