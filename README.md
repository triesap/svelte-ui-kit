# svelte-ui-kit

Editable Svelte components and plain CSS for SvelteKit applications.

svelte-ui-kit is a source-first CLI: it installs component source, styles and
ownership metadata into your application. You can inspect and change that source.
Complex behavior uses Bits UI; simple presentation uses native Svelte/HTML.
Your application imports local components and owns its runtime dependencies.

The package is currently **private and unpublished**. The supported adoption
procedure builds and packs a local distribution, installs it in a separate CLI
host and explicitly prepares the application's dependencies. No public npm
release or one-command remote installation is assumed.

## Start here

Follow [getting started](docs/getting-started.md) from a source checkout. It covers:

1. The tested Node/pnpm toolchain and authentic native preparation before install.
2. Building and packing the real local CLI archive.
3. Installing a separate CLI host and selecting an existing application package.
4. Explicitly installing application-owned Svelte/Bits/date dependencies.
5. Initialization, dry plans, strict diagnosis and a first component.

Native preparation and initial package installation can need network access.
The installed CLI uses bundled assets and does not fetch a registry. The
application must keep its own dependency declarations, lockfile and authentic
native archive; it must work after the CLI host and source checkout are gone.

## Use local source

After adding `button` with the documented CLI workflow, use the default local UI
barrel in an application route:

```svelte
<script lang="ts">
  import { Button } from "$lib/components/ui";
</script>

<form method="POST">
  <Button type="submit">Save</Button>
</form>
```

The application supplies its form action. Button defaults to `type="button"`;
explicit submit/reset remains native. A custom UI mapping changes the local import
path. The kit is an installation tool, not an application scaffold or styled runtime.

## What belongs to the application

Generated `.svelte`, `.ts`, CSS and semantic metadata are app-owned source. Commit
them with your application. Customize components directly, or load app-owned
theme/override CSS after the managed stylesheet. Themes, persistence, color-scheme
and portal host selection are explicit application choices.

The default UI path is `src/lib/components/ui`, with `_kit` metadata and styles
under `src/styles`. Compound families have flat public exports; internal component
imports use siblings. Inspect the [actual component catalog](docs/reference/components/README.md)
and authored contracts before using APIs from the wider upstream library.

## Inspect, reconcile and diagnose

The CLI provides `info`, `init`, `view`, `add`, `sync` and `doctor`. Use `--cwd`
to select one actual application package, dry-run write plans before applying,
and `--json` for deterministic structured results. Add accepts one item ID.
The CLI reports dependency requirements and never runs your package manager or
edits dependency manifests/lockfiles for you.

Synchronization compares base, local and incoming content, retains valid
customization and refuses conflicting batches. Coupled source/style/export changes
must stay compatible. Removing a desired request preserves needed dependencies
and customized retired assets; review application imports explicitly afterward.
There is no remove, force overwrite or automatic merge command.

Strict doctor distinguishes customization from broken/unsafe evidence. Read-only
commands and dry runs leave the entire application untouched, including hidden
state. Retained coordination/recovery state can refuse even an unchanged plan;
an exit-0 replay does not establish that recovery happened. Use the recovery
guide rather than deleting transaction state.

## Documentation

- [Documentation index](docs/README.md).
- [CLI and structured exits](docs/reference/cli.md).
- [Configuration and custom mappings](docs/reference/configuration.md).
- [Components and public types](docs/reference/components/README.md).
- [Styling and portal themes](docs/guides/styling.md).
- [Upgrades, conflicts and retirement](docs/guides/upgrading.md).
- [Interrupted-write recovery](docs/guides/recovery.md).
- [Compatibility and measured limits](docs/reference/compatibility.md).
- [Unreleased changelog](docs/CHANGELOG.md).

The tested native graph, form-reset/callback/SSR identities, portal/CSP behavior,
baseline contrast concerns and browser/filesystem scope are explicit in compatibility.
Plain CSS does not promise zero runtime inline styles. Chromium observations do
not certify every browser, arbitrary theme, assistive technology or all WCAG criteria.
Typechecking, production build, SSR, browser and accessibility review still belong
to your actual resulting application.

## Contribute and maintain

Maintenance guidance is available in the
[development repository](https://github.com/triesap/svelte-ui-kit): read
`docs/CONTRIBUTING.md` for setup/review and `AGENTS.md` → `docs/agents/README.md`
for task-specific maintenance context. Those files are intentionally excluded
from local distribution archives. Public usage/recovery/reference above ships
with the package and shares the same API context with humans and agents.

Keep changes focused, preserve app-owned work and real native contracts, and
verify the owning behavior. New component families or broader extension APIs
require approved scope/contracts. Local build/pack does not authorize publication,
push, deployment or reference-source changes.

## License

Licensed under [MIT](LICENSE-MIT) OR [Apache-2.0](LICENSE-APACHE).
Retain [source and dependency notices](NOTICE.md) when copying generated assets.
