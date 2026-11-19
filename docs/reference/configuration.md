# Configuration and generated layout

All paths are relative to one selected application or library package. `--cwd`
selects that package; the CLI does not scan and mutate every workspace member or
execute application configuration/scripts to discover it. Configuration is
validated against the [canonical project schema](../../assets/schemas/kit.schema.json).

## Desired configuration

The default configuration is `src/lib/components/ui/_kit/kit.json`. It stores
`schemaVersion`, an explicit `target`, the `builtin` registry, integration mappings and **explicit root
requests**, rather than replacing requests with dependency closure.

| Field           | Meaning                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------- |
| `schemaVersion` | Literal integer 1 for every supported target.                                                  |
| `target`        | `sveltekit`, `astro` or `svelte-library`; required on disk.                                    |
| `toolVersion`   | CLI package version, currently 0.1.0; not an exact build identity.                             |
| `registry`      | Built-in registry only; currently `builtin`.                                                   |
| `uiDir`         | Local source and root export directory; default `src/lib/components/ui`.                       |
| `stylesDir`     | Aggregate and application stylesheet directory; default `src/styles`.                          |
| `layoutFile`    | Application layout only: `.svelte` for SvelteKit or `.astro` for Astro.                        |
| `styleEntry`    | Library stylesheet entry only; application layouts and library entries are mutually exclusive. |
| `requested`     | Unique installable root IDs deliberately selected by the app.                                  |

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

### One canonical target schema

The [project schema](../../assets/schemas/kit.schema.json) has ID
`urn:svelte-ui-kit:schema:v1:project-config`. Every persisted project requires
`schemaVersion: 1` and its explicit `target`. This preserves target-bound
integration and ownership; it is not a format-number rewrite of an old project.
Targetless old format 1 and old format 2 are refused. Follow
[canonical adoption](../guides/upgrading.md#canonical-format-adoption) with the
matching previous binary and full application evidence; no automatic migration
or old-format fallback is provided.

Framework, CLI, registry, item, lock, journal and command-envelope identities are
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

Canonical SvelteKit applications require stable Kit2-only declarations and
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
  "target": "sveltekit",
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
A fresh positively detected SvelteKit package has default in-memory intent and
no persisted configuration path until initialization. An empty `_kit` directory
does not establish ownership. Astro and libraries require explicit intent.
Orphan locks, writers or transactions across mappings prevent silent bootstrap
elsewhere. Multiple, malformed or mislocated candidates fail rather than selecting
one by accident. Configuration without a lock is configured awaiting initialization.

## Installed observations

The [lock schema](../../assets/schemas/kit-lock.schema.json) owns installed lineage:
canonical `schemaVersion: 1`, the same target, requested versus transitive origin,
registry/item identities, file/CSS cohort
owners, baseline hashes and integration contracts. Commit this tool-managed
semantic metadata. Do not edit hashes to hide local work. Ephemeral coordination,
staging and durable journal format 3 are distinct recovery evidence, not desired
configuration. The lock schema ID is `urn:svelte-ui-kit:schema:v1:install-lock`.
Exactly three target-bound integrations record the layout or stylesheet entry,
root exports and aggregate stylesheet. The lock binds the exact serialized
configuration bytes; editing desired `requested` roots remains normal sync input.

## Source, exports and styles

Simple components use kebab-case files; compound families have directories and
flat PascalCase root exports. Generated wrappers import local siblings and native
APIs, never CLI internals or a styled kit runtime. The root barrel's managed
regions preserve unrelated exports. The tool does not create a parent components
barrel merely to imitate another framework.

`kit.css` aggregates managed component blocks. `themes.css` and `app.css` remain
application-owned. Supported layout integration imports kit, themes, then app CSS
without replacing existing route rendering or unrelated layout code. SvelteKit
requires lexical `$props()` children and an actual `{@render children()}` (a real
local alias is supported); old export-let/slot layout rendering does not qualify.
Astro preserves its native slots and library packages integrate their CSS entry. Unsupported,
dynamic or ambiguous integration stops with an actionable manual step.
See [styling](../guides/styling.md), [upgrading](../guides/upgrading.md) and
[recovery](../guides/recovery.md).
