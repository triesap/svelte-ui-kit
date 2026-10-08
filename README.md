# svelte-ui-kit

Source-first UI kit for Svelte with installable component source and a CLI.

## Status

The generator implements `info`, `init`, `view`, `add`, `sync` and `doctor`, with
read-only planning and guarded recoverable application. The package is private
and unpublished. The shipped registry includes the CSS-only `tokens` foundation,
native and primitive-backed families covering the original catalog: 21 generated
source items, with stable identity supplied by pinned Svelte/Bits facilities,
plus the approved distinct Alert Dialog. See the
[complete catalog disposition](specs/COMPONENT_CATALOG.md#complete-original-catalog-disposition).
The core and subsequent forms/overlay families have passed separate independent
review; the complete original catalog passed separate S181 acceptance.
The separately installable nine-part `alert-dialog` family is implemented and
qualified and independently accepted in installed consumers. It uses the distinct pinned primitive rather than
a Dialog role switch. Native Action leaves closure to the application; Cancel
owns native close.
Tokens installs independent token, component-customization and theme-integration
metadata under the configured UI state directory, with normal lock baselines.
Representative synthetic registries qualify source/CSS updates, retirement,
conflicts and default/custom layouts in executable and generated-consumer tests.
The component catalog and final platform/package/release acceptance remain in
progress under [the governing sequence](implementation/COMMIT_SEQUENCE.md).

## Native links and the optional RouterLink recipe

Install `anchor` for a styled native link, or request the optional `router-link`
recipe to install RouterLink and its Anchor dependency together:

```sh
node "$CLI" --cwd "$APP" view router-link --source
node "$CLI" --cwd "$APP" add router-link --dry-run
node "$CLI" --cwd "$APP" add router-link
```

Set `CLI` and `APP` as described below. RouterLink composes Anchor directly and
uses its styles; it adds no router runtime or stylesheet. Import from your
configured UI directory (the default is `$lib/components/ui`):

```svelte
<script lang="ts">
  import { resolve, asset } from "$app/paths";
  import { RouterLink, Anchor } from "$lib/components/ui";
</script>

<RouterLink href={resolve("/settings")} data-sveltekit-preload-data="hover">
  Settings
</RouterLink>
<Anchor href="https://example.com" target="_blank">External site</Anchor>
<Anchor href={asset("/report.pdf")} download>Download report</Anchor>
```

The application resolves its own internal routes, including route parameters,
query strings and fragments. SvelteKit's `resolve`/`asset` account for configured
base paths; RouterLink forwards the resulting URL unchanged. Supply external
URLs directly. SvelteKit owns native `data-sveltekit-*` navigation options,
including focus/scroll retention, history replacement, reload and preloading.
Their types come from the application's actual SvelteKit augmentation. Set
`aria-current="page"` or a class yourself for current-page presentation.

Both components render one native anchor, support native events/cancellation,
children snippets and `bind:ref`, and preserve native target/download behavior.
An omitted `rel` on `target="_blank"` defaults to `noopener noreferrer`; an
explicit value, including an empty string, is preserved. For an action, install
`button` separately and compose a native Button beside the link, for example
`<Button onclick={save}>Save</Button>` with an application-owned `save` function.
Navigation uses an anchor; actions use a button. Do not nest these interactive
elements or expect Button to accept a navigation `href`.

## Dialog portal themes

Compose DialogRoot, Trigger, Portal, Overlay, Content, Title, optional Description
and Close explicitly. Give Content an accessible name through Title or the
native naming attributes. Put global theme selectors on a document ancestor
when Portal uses its default body target: tokens scoped only around Trigger do
not follow the portaled Content. For nested themes, use Portal's native `to`
with a suitable host inside that theme. Token changes inherit immediately while
open; the kit does not copy computed themes into inline styles.

A custom host changes the clipping and stacking environment. A transformed
ancestor can contain fixed-position Content, while `overflow: hidden` clips it
and an isolated stacking context constrains its z-index. Use an unclipped host
with a suitable stacking context; the kit does not move it elsewhere to conceal
these consequences. Global and nested hosts, live changes and an intentionally
unsuitable transformed clipping host are tested against actual CLI-installed
applications in default and custom source layouts.

Server rendering follows the pinned primitive: body/custom portal Content is
mounted in the browser; disabled (inline) Portal can render initially open
Content on the server. Child Title/Description relationships are registered
during hydration, which completes native naming attributes. Initial state and
generated IDs remain local to each request/instance. The native first opening
of newly portaled Content omits its animation-completion callback in Bits2.19.3;
completed closing emits it. The kit forwards the native callback unchanged.

The core qualification installs tokens, Spinner, Button, Switch and Dialog
together through the built executable and a real locally installed tarball.
Default/custom source layouts are compiled, built, server-rendered and exercised
in Chromium. Owned synthetic package revisions qualify safe upgrades and atomic
cohort-conflict refusal while preserving application customization. These checks
passed [independent core review](implementation/evidence/RCLD-06_QUALIFICATION.md).
Distinct Alert Dialog and Menu also passed
[independent family review](implementation/evidence/RCLD-07_QUALIFICATION.md),
including actual selection, floating placement, live themes and measured CSP
limits. Checkbox, Radio, Tabs, Collapsible and Field passed
[independent forms and disclosures review](implementation/evidence/RCLD-08_QUALIFICATION.md),
including real form submission/reset, keyboard behavior, dynamic associations,
SSR/hydration, retained child state and measured CSP/motion limits. Original
S149–S181 catalog passed
[independent complete catalog review](implementation/evidence/RCLD-09_QUALIFICATION.md),
including native links, image fallback, presentation and request-local identity.
S182–S203 platform/package/full-MVP acceptance remains open. The package
remains unpublished.

## Use the local built CLI

Build from this clone after installing its frozen development dependencies.
`CLI` below is the built executable's absolute path; set `APP` to an existing
SvelteKit application package, not a monorepo workspace root. The CLI never
executes the application's configuration, package manager or install scripts.

```sh
pnpm run build
CLI="$(pwd)/dist/cli/main.js"
# Set APP to the SvelteKit application package you want to inspect.
```

The application must declare SvelteKit and have its compatible Svelte dependency
installed. Inspect `info` and perform any reported dependency setup manually
before expecting strict diagnosis to pass.

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

Install the dependencies reported by `info` or a plan yourself, then rerun the
checks. Source installation and actual installed dependency readiness are
separate. `doctor --strict` exits with code 3 for broken/unsafe installation evidence; valid
source/CSS customization is reported without rewriting files or falsely failing
strict checks. Doctor's structural/syntax diagnosis does not replace the app's
own typecheck, production build, SSR and browser tests.

Inspect `view tokens --source` and install the foundation with `add tokens
--dry-run`, then `add tokens`. It contributes plain CSS without a component
source file or runtime dependency. Component items follow their qualification
gates.

Once a qualified component item is included in the bundled registry, inspect and request
its exact kebab-case id with `view <item> --source`, `add <item> --dry-run`, then
`add <item>`. These placeholders do not claim a currently shipped item. `add`
records only the explicit request; registry dependencies remain transitive.
`sync` reconciles the configured requests, including intentional retirement.
There is no network registry, automatic package installation, merge or force flag.
Add `--json` to receive exactly one deterministic result envelope on stdout,
including failures. Human failures use stderr; use the documented frozen exits
in [API contracts](specs/API_CONTRACTS.md) for automation.

Defaults are `src/lib/components/ui`, its `_kit` state, `src/styles`, and the
statically detected SvelteKit root layout. A valid explicit `kit.json` under the
chosen UI root's `_kit` selects `uiDir`, `stylesDir` and `layoutFile`; see
[the configuration model](specs/DATA_MODEL.md). Only one installation may be
present. Explicit mapping can resolve dynamic routes without evaluating project
code; unsafe, malformed, ambiguous or unsupported project identity still refuses.

For example, create `app/ui/_kit/kit.json` in the selected application before
initializing this custom mapping:

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

Generated Svelte/TypeScript/plain CSS is application-owned source, with no kit
runtime dependency. Preserve local edits: unchanged upstream keeps their original
base, changed incompatible source/CSS/export cohorts refuse the entire batch,
and customized retired targets remain application-owned. Inspect the incoming
source and dry plan, reconcile the reported conflict yourself, then rerun app
verification. Never edit base hashes to declare local edits accepted. No dry-run,
read-only or conflict path creates hidden transaction files or changes manifests.
Interrupted transaction evidence is retained and diagnosed; follow
[the recovery contract](specs/SECURITY_AND_TRANSACTIONS.md) rather than deleting
owner evidence or using PID/age takeover.

`pnpm run test:package` creates and inspects a local tarball without publication;
its extracted executable uses bundled assets without an authoring-tree fallback.

## Goals

- Provide a consistent component and theming foundation.
- Install components as project-owned source files.
- Use a CLI to add, inspect, and update components.
- Keep primitives, styling, and accessibility behavior predictable.

## Development

Requires Node.js `24.21.0` (see `.node-version`) and pnpm `11.22.0` (see
`packageManager` in `package.json`).

```sh
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run build
pnpm run test:cli-bootstrap
pnpm run test:unit -- tests/unit/cli-bootstrap.test.ts
pnpm run test:integration -- tests/integration/harness.test.ts
pnpm run test:components -- tests/components/compatibility.test.ts
pnpm run test:harness
pnpm run test:package
pnpm run fixture:check
pnpm run fixture:build
pnpm run test:fixture
pnpm run check:contracts
pnpm run test:contracts
pnpm run lint
pnpm run format:check
```

The suite runner is dependency-free: for every discovered `*.test.ts` entry
(including dot-prefixed and `..`-prefixed names) it writes an ephemeral
compiler configuration inside the ignored `.unit-test-build/<suite>/` tree,
extends the tracked `tsconfig.<suite>.json`, and compiles with the pinned `tsc`
into that suite's isolated output before executing the selected tests with
Node's built-in `node:test` runner. `--suite unit` (the default) runs
`tests/unit`; `--suite integration` runs `tests/integration` with the typed
helpers under `tests/helpers/`, which create owned temporary projects, capture
complete tree snapshots and invoke the real built CLI. Operands are
repository-relative `*.test.ts` files; absolute operands, parent-directory
components and symlinked test roots or ancestors are rejected, discovery is
deterministic, and every selected file must actually execute a passing test.
Any `test:fail` event — including a TODO-marked one — fails the run wherever the
test was defined, and one suite's run never removes another suite's output.
`pnpm run test:harness` runs the runner's own regression suite.

`implementation/evidence/COMMANDS.md` records the complete local command map and
the baseline `.github/workflows/ci.yml` lanes (Ubuntu 24.04, Node 24.21.0, pnpm
11.22.0, immutable action revisions). The workflow is validated locally but has
not been run remotely.

The fixture also carries a fixture-only Bits compatibility component
(`tests/fixtures/consumer/src/lib/compatibility/SwitchFixture.svelte`, served
at `/compatibility`) that exercises the pinned `bits-ui 2.19.3`
`Switch.Root`/`Switch.Thumb` with `bind:checked`, `bind:ref` and a real `child`
snippet forwarding a delegated native button. `pnpm run test:components` runs
the typed component suite: it type-checks the maintained component and proves
incompatible `checked`/`ref`/`child` examples fail `svelte-check` for their
intended diagnostics in disposable copies. The fixture pins `csstype 3.1.3`
(an undeclared transitive type dependency of the upstream declarations) and sets
`skipLibCheck` to tolerate an upstream TypeScript union-complexity limit in the
Bits barrel; authored fixture source remains under `strict` checking.

The CLI entrypoint is `src/cli/main.ts`, compiled with the pinned `tsc` to
`dist/cli/main.js` (build output is ignored and never committed). Argument
classification and result handling live in the pure `src/cli/args.ts` and
`src/cli/run.ts` modules, which perform no I/O; `main.ts` is the adapter that
reads the bundled package metadata next to the built module and applies the
real stdout/stderr/exit effects. Minimal readonly `ProjectInput`,
`RegistrySnapshot` and `PlanningOutcome` interfaces under `src/project`,
`src/registry` and `src/codegen` express the already-approved responsibilities
with immutable captured planning, validated registry provenance and guarded application. `tests/unit/boundaries.test.ts` proves the pure
modules import and execute without filesystem writes, that the injected result
handling matches the built adapter, that the boundary types reject invalid
values at compile time, and that consumer fixture sources never import
CLI/Node/registry internals.

`pnpm run lint` runs the flat `eslint.config.mjs` configuration (JavaScript,
TypeScript and Svelte recommended presets plus the Prettier conflict presets)
over the maintained authoring tree with `--max-warnings 0`; it parses
TypeScript inside Svelte `<script>` blocks and surfaces Svelte compiler and
accessibility diagnostics. `pnpm run format:check` checks the same authoring
inputs with Prettier and the Svelte formatter plugin and never rewrites files;
`pnpm run format` is the explicit authoring-only write command. Both tools skip
reserved dependency/output trees (`node_modules`, `.pnpm-store`, `dist`,
`build`, `.svelte-kit`, `coverage`, `.unit-test-build`) at every depth plus the
explicitly rooted `tests/fixtures/generated/` boundary and ignored evidence-log
trees, and neither ever traverses an unrelated external application.
`pnpm run typecheck` remains a separate compiler check; lint, format and
typecheck establish authoring hygiene only, not consumer typecheck/build,
SSR/browser qualification or release readiness.

The maintained consumer fixture is the private ESM workspace package
`svelte-ui-kit-consumer-fixture` at `tests/fixtures/consumer/`. It is the
second explicit member of `pnpm-workspace.yaml` and shares the single root
lockfile; it pins `svelte 5.57.1` as its only runtime dependency and exact
development pins for `@sveltejs/kit`, `@sveltejs/vite-plugin-svelte`,
`@sveltejs/adapter-node`, `svelte-check`, `vite`, `typescript` and
`@types/node`. It is a hand-authored Svelte 5/SvelteKit application with SSR
and CSR enabled and a request-local `+page.server.ts` load rendered visibly
into the route markup.

`pnpm run fixture:check` runs the fixture's real `svelte-kit sync` followed by
`svelte-check --tsconfig ./tsconfig.json --fail-on-warnings`; `pnpm run
fixture:build` runs the real Vite production build through the Node adapter;
`pnpm run test:fixture` builds the fixture and then runs the focused
`node:test` suites at `tests/smoke/consumer-fixture.test.mjs` and
`tests/smoke/owned-server.test.mjs`. The SSR suite hosts the adapter's
production handler in an owned child process on an OS-assigned loopback port
and asserts the actual server-rendered HTTP HTML before client JavaScript runs,
distinct repeated/concurrent request values, HTML escaping, and the real
failure controls for a Svelte/TypeScript mismatch and for disabling SSR. HTTP
status and content type are asserted independently, so an HTTP 500 or a wrong
content type fails the suite instead of satisfying the missing-markup control.
The owned-server boundary records stderr and the exit event through teardown,
bounds startup, request headers/body and stop deadlines, and the lifecycle
suite drives deterministic startup-failure, stderr, post-ready exit, stalled
header/body and cleanup faults. The maintained baseline is separate from lifecycle suites, which run generated
default/custom consumers through actual add/update/retirement check, production
build and SSR stages. Packed executable inventory is qualified separately; final
catalog/browser/platform/release acceptance remains open.

`pnpm run test:browser` builds the fixture and runs the Playwright 1.63.0
harness at `tests/browser/harness.spec.ts` with bundled headless Chromium over
`playwright.config.ts`. Install the pinned browser once with
`pnpm exec playwright install chromium`. The harness starts the built
production handler through the same owned-server boundary and asserts the
accessible heading/labels, Tab/Shift+Tab focus order, native checkbox keyboard
activation, form navigation with a request-time query update, and a fixture-only
client-state interaction that only works after hydration. Unexpected server
stderr/exits, page exceptions, console errors and hydration warnings fail the
lane. The initially qualified platform is bundled Chromium on macOS with Node
24.21.0; no Firefox/WebKit/Windows or CI-execution claim is made.

## Contributing

See `CONTRIBUTING.md`.

## License

MIT OR Apache-2.0. See `LICENSE-MIT` and `LICENSE-APACHE`.

## Menu floating composition

The installable eight-part Menu family supplies Root, Trigger, Portal, Content,
Item, RadioGroup, RadioItem and ItemIndicator with flat `Menu*` exports. It is
locally qualified in generated default/custom applications and awaits the
separate sequence acceptance. Bind Root open and RadioGroup value explicitly;
compose ItemIndicator from RadioItem's native checked snippet. Give Content an
accessible name. Pinned Bits 2.19.3 typeahead searches visible DOM text; its public
textValue prop is forwarded but does not change search behavior in that version.

Keep delegated Content's outer wrapperProps separate from inner props; native
floating geometry belongs to the outer element and kit styles to the inner.
Use document themes for body portals or an explicit native host within a nested
theme. Hosts with transforms or overflow clipping retain their actual stacking
and clipping limitations. Force-mounted delegated Content leaves closed
visibility to the application, using the native open snippet.

Plain CSS does not guarantee no runtime inline styles. The measured production
CSP fixture preserves geometry with self-hosted stylesheets, nonce-based script
policy and style-src-attr 'unsafe-inline'. With style-src-attr 'none', server
floating style attributes are refused before hydration. Do not strip those
styles or infer strict-CSP parity from a later hydrated position. See the
[Menu mapping and measured limits](specs/component-maps/menu.md).
