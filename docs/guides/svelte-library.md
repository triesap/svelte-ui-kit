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

Write canonical format-1 intent to `<uiDir>/_kit/kit.json`, for example:

<!-- documented-library-intent:start -->

```json
{
  "schemaVersion": 1,
  "target": "svelte-library",
  "uiDir": "src/lib",
  "stylesDir": "src/styles",
  "styleEntry": "src/styles.css",
  "requested": []
}
```

<!-- documented-library-intent:end -->

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

## A complete package boundary

This standalone `package.json` resolves the tested workspace catalog explicitly.
In a workspace, centralize the same versions in its catalog; `pnpm pack` must
resolve portable published peers. Keep all generated-source peers (Svelte plus
Bits/date when selected) visible to consumers. Local native files belong only in
development dependencies, never published peer requirements:

<!-- documented-library-manifest:start -->

```json
{
  "name": "@example/generated-ui-library",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@12.16.1",
  "engines": {
    "node": ">=24.22.1 <25"
  },
  "svelte": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "svelte": "./dist/index.js",
      "default": "./dist/index.js"
    },
    "./styles.css": "./src/styles.css"
  },
  "sideEffects": ["./src/styles.css", "./src/styles/*.css"],
  "files": [
    "dist",
    "src/lib",
    "src/styles",
    "src/styles.css",
    "!**/.svelte-ui-kit/**"
  ],
  "scripts": {
    "check": "svelte-check --tsconfig ./tsconfig.json --fail-on-warnings",
    "build": "svelte-package --input src/lib --output dist --tsconfig tsconfig.json"
  },
  "peerDependencies": {
    "svelte": "5.57.3",
    "bits-ui": "2.20.2-svelte-ui-kit.2",
    "@internationalized/date": "3.12.4"
  },
  "devDependencies": {
    "@sveltejs/package": "3.0.1",
    "@internationalized/date": "3.12.4",
    "bits-ui": "file:./vendor/bits-ui-2.20.2-svelte-ui-kit.2.tgz",
    "svelte": "file:./vendor/svelte-5.57.3-reset-dispatch.2.tgz",
    "svelte-check": "4.7.7",
    "typescript": "6.0.3",
    "@types/node": "24.19.2",
    "csstype": "3.2.3"
  }
}
```

<!-- documented-library-manifest:end -->

Copy and verify both bundled archives into `vendor` using the common extraction
procedure, then install explicitly with strict peers. Keep `tsconfig.json`:

<!-- documented-library-tsconfig:start -->

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "skipLibCheck": false,
    "verbatimModuleSyntax": true,
    "allowJs": true,
    "checkJs": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "types": ["svelte", "node"],
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*.svelte", "src/**/*.ts"],
  "exclude": ["dist", "node_modules", ".native-build"]
}
```

<!-- documented-library-tsconfig:end -->

For the intent above, use `init`, then `add` for `button`, `field`, `menu` and
`dialog`. `pnpm run check` and `pnpm run build` run the native Svelte checker and
packager; `pnpm pack --pack-destination "$ARCHIVES"` creates a local archive.
The generated `src/styles.css` imports `src/styles/{kit,themes,app}.css`; include
all of them. This is local packing, not a public release. Keep semantic lineage
and exclude every transient coordination namespace as the manifest demonstrates.

Consumers explicitly install the packed archive and their own qualified native
archives. They have no CLI runtime dependency. In an Astro Svelte island, import
all parts from the package, keeping the whole composition inside one island:

<!-- documented-library-island:start -->

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
  } from "@example/generated-ui-library";

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

<!-- documented-library-island:end -->

In the Astro layout frontmatter, import the library stylesheet once, and hydrate
the island from the Astro page with `client:load` as in the [Astro guide](astro.md).
Do not generate a second copy of the kit into the consuming application:

<!-- documented-library-css:start -->

```ts
import "@example/generated-ui-library/styles.css";
```

<!-- documented-library-css:end -->

A SvelteKit app uses the same island/component exports. Its
`src/routes/+layout.svelte` imports CSS once and renders the application children:

<!-- documented-library-kit-layout:start -->

```svelte
<script lang="ts">
  import "@example/generated-ui-library/styles.css";
  let { children } = $props();
</script>

{@render children()}
```

<!-- documented-library-kit-layout:end -->

The package name is an example; replace it consistently with your actual library
name and installed tarball. Published SemVer peers describe a compatibility
boundary; current kit qualification still requires the exact documented native
archive identities, not an arbitrary matching registry installation.

The maintained blueprints are `tests/fixtures/library` and
`tests/fixtures/library-kit-consumer`. From a bootstrapped checkout, run
`pnpm run build`, then
`node tools/run-unit-tests.ts --suite integration tests/integration/library-consumers.test.ts`.
This packs a generated library, makes its original source unavailable, installs
the archive into independent Astro and SvelteKit applications, and runs strict
native checking, production builds, Node SSR and hydrated browser controls.
Consumer source, command transcripts, HTML and screenshots remain under ignored
`.artifacts/verification/runtime-projects/library-consumers-*`.
