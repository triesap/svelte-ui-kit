# Getting started

svelte-ui-kit installs editable Svelte/TypeScript source and plain CSS into a
SvelteKit or Astro application, or a standalone Svelte library. The consumer owns
that source and its Svelte/Bits
dependencies. The kit is a private local CLI distribution; no npm release is
assumed. Use a separate CLI host so the application has no kit runtime dependency.

## Build a local distribution

Use Node **24.22.1** and pnpm **12.16.1** for the tested baseline. These are the
versions in the repository's `.node-version` and `package.json`; its package
engine range is narrower than a promise of support for all Node releases.
Git, a POSIX shell, `tar`, and SHA-256 tooling are needed by the local procedures.
Native preparation and dependency installation may need network access.

Clone the repository and change to its root. Prepare the authenticated native
artifact **before** installing development dependencies:

```sh
node tools/prepare-native-artifacts.ts --fixture
pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict
pnpm run typecheck
pnpm run build
```

Preparation also supplies the maintained consumers' application-owned archives.
Builds authenticate the caches and bundle both native archives into the CLI. Do not
replace frozen pins or edit installed declarations to make a check pass.

Set `ARCHIVES` to a fresh absolute directory for local package artifacts, create
it, and build/pack through the production staging implementation from the repository root:

```sh
pnpm run pack:local "$ARCHIVES"
```

Set `ARCHIVE` to the absolute `.tgz` path actually returned by pack. Record and
verify its SHA-256 when transporting it; the CLI package digest depends on the
exact build and included documentation and is not a universal release constant.

## Install a separate CLI host

Set `CLI_HOST` to a fresh absolute directory, create it, and put a `package.json`
containing `{ "private": true }` there. From the repository shell with `ARCHIVE`
set, explicitly install the real local archive:

```sh
pnpm --dir "$CLI_HOST" add --ignore-scripts "$ARCHIVE"
CLI="$CLI_HOST/node_modules/svelte-ui-kit/dist/cli/main.js"
```

Keep `CLI`, `CLI_HOST`, `ARCHIVE`, and `APP` as task-specific shell variables.
The CLI host is not the application. Installing this package in the host does not
install Svelte/Bits dependencies into the application or change its manifest. A fresh
host can need network access for registry metadata and platform-native compiler
binaries. Offline installation requires a previously resolved lock and fetched
closure for the target platform; an authoring checkout's cache alone is not that
preparation. Use ordinary pnpm lock resolution and `pnpm fetch` before a frozen
offline install.

## Choose a target

The CLI-host preparation above is shared. Select the application package with
`APP`; these commands never scaffold a framework or add dependencies for you.
Use the archive procedure below for every target, then follow the appropriate
intent and composition guide **before** initializing:

- SvelteKit: the remaining steps on this page use the default v1 target.
- [Astro](guides/astro.md): use explicit v2 Astro intent and one Svelte component
  per contextful island; no SvelteKit dependency is required.
- [Svelte library](guides/svelte-library.md): use explicit v2 library intent and
  native development archives, with portable SemVer peers for consumers.

## Prepare native dependencies

For SvelteKit, set `APP` to the absolute path of an existing SvelteKit application package, not
a workspace root. Back up or commit current work before installation. The app
must declare SvelteKit, have supported configuration and own its check/build
tooling. The tested setup uses SvelteKit 2.70.3, Vite 8.3.5, TypeScript 6.0.3,
and svelte-check 4.7.7. The
[tested consumer manifest](https://github.com/triesap/svelte-ui-kit/blob/dfc7c513fd6edb25546bf43e4b17879554c2bd30/tests/fixtures/consumer/package.json)
and its [owning version catalog](https://github.com/triesap/svelte-ui-kit/blob/dfc7c513fd6edb25546bf43e4b17879554c2bd30/pnpm-workspace.yaml)
are source references for the qualified native files and resolved versions,
not standalone manifests or a promise that the CLI creates an application.
Astro and library packages use their own framework/build configuration instead.

For the complete catalog, applications explicitly install `@internationalized/date`
3.12.4 as below. Libraries instead declare it as a peer and development dependency
as shown in the library guide, and skip this application-only `pnpm add` command.
Every target copies both authentic local archives **before** installing them. Svelte retains raw version 5.57.3; its qualified reset-runtime build is
`5.57.3-reset-dispatch.2`. An ordinary registry installation of that same version
does not qualify. Run this with `APP` and `ARCHIVE` set:

```sh
pnpm --dir "$APP" add @internationalized/date@3.12.4
```

Each extraction runs inside the checked, fail-fast application subshell. A linked
vendor directory or either existing archive refuses before extracting bytes.
The archive variables remain available in the calling shell.

<!-- documented-native-extraction:start -->

```sh
NATIVE_ARCHIVE=bits-ui-2.20.2-svelte-ui-kit.1.tgz
SVELTE_ARCHIVE=svelte-5.57.3-reset-dispatch.2.tgz
(
  set -eu
  cd "$APP"
  test ! -L vendor
  mkdir -p vendor
  test -d vendor
  test ! -e "vendor/$NATIVE_ARCHIVE"
  test ! -L "vendor/$NATIVE_ARCHIVE"
  test ! -e "vendor/$SVELTE_ARCHIVE"
  test ! -L "vendor/$SVELTE_ARCHIVE"
  tar -xOf "$ARCHIVE" "package/dist/native/$NATIVE_ARCHIVE" > "vendor/$NATIVE_ARCHIVE"
  shasum -a 256 "vendor/$NATIVE_ARCHIVE"
  tar -xOf "$ARCHIVE" "package/dist/native/$SVELTE_ARCHIVE" > "vendor/$SVELTE_ARCHIVE"
  shasum -a 256 "vendor/$SVELTE_ARCHIVE"
)
```

<!-- documented-native-extraction:end -->

Proceed only if the Bits archive digest is exactly
`1e952f7cb1edd822650384e9e30dd75e864b3848d4a20fc73cb8ccd5224d1f27`
and the Svelte archive digest is exactly
`a7c2bfa42a6827ba2ced3e281a6f1ed2e8e1cfd4b1cddf1698796089f411abc4`.
Then run (libraries use `add -D` and retain SemVer peers):

```sh
pnpm --dir "$APP" add "./vendor/$NATIVE_ARCHIVE" "./vendor/$SVELTE_ARCHIVE"
```

Keep both regular archives, the explicit local-file dependencies, and the application
lockfile in the app's delivery system. Copying the native archives is application
setup, not a generator side effect. The app must continue checking and building
after the CLI host and source clone are unavailable. Unknown, changed, escaping
or linked archives and altered installed distributions are refused.

## Initialize a SvelteKit application

Astro and library users now continue with their target guide, not the default
SvelteKit initialization below. Component reference examples use SvelteKit's
`$lib/components/ui` alias. The generator does not create that alias in Astro
or libraries; import the actual generated relative `index.js` or package export.

### Inspect and initialize

With `CLI` and `APP` set, these seven commands inspect, initialize, validate,
and prove clean replay. A dry run writes nothing, including hidden coordination
state. The CLI never evaluates app configuration or runs its package manager.

<!-- documented-cli-workflow:start -->

```sh
node "$CLI" --cwd "$APP" info
node "$CLI" --cwd "$APP" init --dry-run
node "$CLI" --cwd "$APP" init
node "$CLI" --cwd "$APP" doctor --strict
node "$CLI" --cwd "$APP" sync --dry-run
node "$CLI" --cwd "$APP" sync
node "$CLI" --cwd "$APP" init
```

<!-- documented-cli-workflow:end -->

`info` and plans report dependency requirements. Install missing dependencies
explicitly and rerun diagnosis. `doctor --strict` exits 3 for broken or unsafe
installation evidence; valid source/CSS customization alone does not fail it.
Its structural checks do not replace app typechecking, production build, SSR,
or browser verification.

Source generation can precede dependency installation. `init` and component plans
then report `DEPENDENCY_NOT_READY` and explicit archive setup instructions; their
success does not establish runtime readiness. Every present native installation
must authenticate, and a changed or unqualified installation refuses. Complete
the explicit installation and strict diagnosis before application qualification.

## Install and use components

These commands use actual bundled items. `add` accepts one ID at a time and
records only that explicit request; needed registry dependencies stay transitive.

<!-- documented-item-install:start -->

```sh
node "$CLI" --cwd "$APP" view button --source
node "$CLI" --cwd "$APP" add button --dry-run
node "$CLI" --cwd "$APP" add button
node "$CLI" --cwd "$APP" add dialog
node "$CLI" --cwd "$APP" add menu
node "$CLI" --cwd "$APP" add field
```

<!-- documented-item-install:end -->

Button also installs Spinner and the CSS-only tokens foundation. Generated
sources use direct local sibling imports; the root barrel provides flat exports.
In an application route using the default UI mapping:

```svelte
<script lang="ts">
  import { Button } from "$lib/components/ui";
</script>

<Button type="submit">Save</Button>
```

Use `type="submit"` inside an appropriate form; the default Button type is
`button`. Supply the application action or form behavior yourself.

The default UI directory is `src/lib/components/ui`, with `_kit` metadata below
it and aggregate styles under `src/styles`. Initialization preserves existing
layout code while adding supported style imports. See
[configuration](reference/configuration.md) for explicit custom mappings and
[styling](guides/styling.md) for application-owned themes and overrides.

Commit generated source, desired configuration, semantic lock metadata, and app
dependency declarations. Retain the distribution's [notice](../NOTICE.md),
[MIT license](../LICENSE-MIT), and [Apache license](../LICENSE-APACHE) in copied
source notices. Check/build/test the resulting application before delivery.

There is no remote registry, automatic installation, merge, force flag, or remove
command. Follow [upgrading](guides/upgrading.md) for reconciliation and retirement,
and [recovery](guides/recovery.md) for interrupted writes. Neither a successful
transaction nor a clean replay proves application correctness or recovery.
