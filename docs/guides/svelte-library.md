# Svelte component libraries

Select a real ESM package with `--cwd`. Declare Svelte as a peer, a root export
with `types` and `svelte` conditions, and an export for the actual CSS entry.
The package owns its build scripts, declarations, exports and native peers;
the generator never rewrites `package.json` or invents an application framework.
Use the selected workspace's catalogs for shared versions. Install the qualified
Bits and Svelte archives from the locally packed CLI as explicit package-owned
development dependencies. Follow the archive extraction and digest checks in
[getting started](../getting-started.md), using `pnpm add -D` for those local
files. Preserve published peer requirements as SemVer; a local archive path is
not a portable published peer requirement. Each consuming application must own
and explicitly install its qualified native archives as well.

Write v2 intent to `<uiDir>/_kit/kit.json`, for example:

```json
{
  "schemaVersion": 2,
  "target": "svelte-library",
  "uiDir": "src/lib",
  "stylesDir": "src/styles",
  "styleEntry": "src/styles.css",
  "requested": []
}
```

The stylesheet entry replaces the application layout role. Supported top-level
CSS imports integrate kit, themes and application CSS in that order while
preserving unrelated source. Conditional, late, escaped or ambiguous imports
produce a nonmutating manual-step diagnostic. A library cannot supply
`layoutFile`, and application intent cannot be reinterpreted as library intent.
Workspace automatic selection recognizes a standalone library only when it has
explicit library intent; ordinary dependency packages remain ordinary packages.

Use the standard `info`, `init --dry-run`, `init`, `add`, `sync` and `doctor`
commands. Generated source, export regions, CSS and semantic locks belong to the
library. Commit semantic lineage, and exclude transient `_kit/.svelte-ui-kit`
coordination from distribution. A package-owned `files` list overrides the root
Git ignore rules. Include an explicit negative entry such as
`"!**/.svelte-ui-kit/**"` so source and built-output copies cannot ship journals,
staged images or backups. Keep semantic `kit.json` and `kit.lock.json` in the
distribution for truthful lineage. Read/no-change commands do not repair retained
journals. Recovery authenticates the exact library target and stylesheet role.

Build declarations with a native Svelte packager, preserve Svelte source in the
published export, and include every CSS file referenced by the exported entry.
Consumers import the library's exports and CSS; Astro consumers explicitly select
hydration directives, and SvelteKit consumers own their application layout.
The library adds no styled runtime dependency.

The maintained blueprints are `tests/fixtures/library` and
`tests/fixtures/library-kit-consumer`. From a bootstrapped checkout, run
`pnpm run build`, then
`node tools/run-unit-tests.mjs --suite integration tests/integration/library-consumers.test.ts`.
This packs a generated library, makes its original source unavailable, installs
the archive into independent Astro and SvelteKit applications, and runs strict
native checking, production builds, Node SSR and hydrated browser controls.
Consumer source, command transcripts, HTML and screenshots remain under ignored
`.artifacts/verification/runtime-projects/library-consumers-*`.
