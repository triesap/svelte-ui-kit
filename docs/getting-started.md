# Getting started

svelte-ui-kit installs editable Svelte/TypeScript source and plain CSS into a
SvelteKit application. The application owns that source and its Svelte/Bits
dependencies. The kit is a private local CLI distribution; no npm release is
assumed. Use a separate CLI host so the application has no kit runtime dependency.

## Build a local distribution

Use Node **24.21.0** and pnpm **11.22.0** for the tested baseline. These are the
versions in the repository's `.node-version` and `package.json`; its package
engine range is narrower than a promise of support for all Node releases.
Git, a POSIX shell, `tar`, and SHA-256 tooling are needed by the local procedures.
Native preparation and dependency installation may need network access.

Clone the repository and change to its root. Prepare the authenticated native
artifact **before** installing development dependencies:

```sh
node tools/prepare-native-dependency.mjs --fixture
pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict
pnpm run typecheck
pnpm run build
```

Preparation also supplies the maintained consumer's application-owned archive.
Builds authenticate the cache and bundle the native archive into the CLI. Do not
replace frozen pins or edit installed declarations to make a check pass.

Set `ARCHIVES` to a fresh absolute directory for local package artifacts, create
it, and pack from the repository root:

```sh
pnpm pack --json --pack-destination "$ARCHIVES"
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
install Svelte/Bits dependencies into the application or change its manifest.

## Prepare the application

Set `APP` to the absolute path of an existing SvelteKit application package, not
a workspace root. Back up or commit current work before installation. The app
must declare SvelteKit, have supported configuration and own its check/build
tooling. The tested setup uses SvelteKit 2.70.3, Vite 8.3.1, TypeScript 6.0.3,
and svelte-check 4.7.6. The
[tested consumer manifest](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/fixtures/consumer/package.json)
is a source reference, not a promise that the CLI creates an application.

For the complete catalog, explicitly install Svelte 5.57.1 and
`@internationalized/date` 3.12.4, then copy the authentic local Bits archive into
the application **before** installing it. Run this with `APP` and `ARCHIVE` set:

```sh
pnpm --dir "$APP" add svelte@5.57.1 @internationalized/date@3.12.4
cd "$APP"
test ! -L vendor && mkdir -p vendor && test -d vendor
NATIVE_ARCHIVE=bits-ui-2.19.5-svelte-ui-kit.2.tgz
test ! -e "vendor/$NATIVE_ARCHIVE" && test ! -L "vendor/$NATIVE_ARCHIVE" && \
  tar -xOf "$ARCHIVE" "package/dist/native/$NATIVE_ARCHIVE" > "vendor/$NATIVE_ARCHIVE"
shasum -a 256 "vendor/$NATIVE_ARCHIVE"
```

Proceed only if the native archive digest is exactly
`1384075b9d764f80b92a94e378f233c2382dd6125fb3c301ae46be6d7746e603`.
Then, still in `APP`, run:

```sh
pnpm add "./vendor/$NATIVE_ARCHIVE"
```

Keep this regular archive, the explicit local-file dependency, and the application
lockfile in the app's delivery system. Copying the native archive is application
setup, not a generator side effect. The app must continue checking and building
after the CLI host and source clone are unavailable. Unknown, changed, escaping
or linked archives and altered installed distributions are refused.

## Initialize and inspect

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
