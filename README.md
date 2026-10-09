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
The complete catalog and cross-component qualification passed
[independent S193 review](implementation/evidence/RCLD-10_QUALIFICATION.md).
Final installed-package, compatibility and release acceptance remain in progress
under [the governing sequence](implementation/COMMIT_SEQUENCE.md).

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

The same inherited vocabulary styles the complete catalog: keep generated
blocks in the single `kit.css` aggregate and put application theme selectors in
`themes.css`, followed by overrides in `app.css`. Sync preserves both
application-owned stylesheets and existing layout imports. Document and nested
theme changes update installed controls and surfaces, including already-open
Dialog, Alert Dialog and Menu content under its actual portal ancestor.
Theme choice and persistence belong to the application; for example, an
application can restore its own stored document attribute after hydration.
The kit adds no theme store or persistence policy.

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
during hydration, which completes native naming attributes. Application
state remains local to each request/instance. Field/native identity
uses Svelte request-local IDs; native floating wrappers also use the pinned
primitive's process counter. Semantic relationships are qualified across
repeated/concurrent SSR and hydration; counter values are not promised to reset
for each request. The native first opening
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
S182–S193 passed the separate cross-component/platform gate. S194–S200 are
verified implementation candidates; the final S203 gate remains open. The
package remains unpublished. The qualified local native build resolves the
strict declaration errors; cumulative AC20 and independent final acceptance
remain open. See [compatibility evidence](implementation/evidence/COMPATIBILITY.md).

## Use the local built CLI

For an isolated installation, build and pack this repository, then explicitly
install the local archive in an empty CLI host project. Set `ARCHIVES` to a
directory for local artifacts, `CLI_HOST` to that project and `APP` to your
existing SvelteKit application. Create those directories and initialize the
empty standalone host with a `package.json` containing `{ "private": true }`.
This does not assume an npm release:

```sh
pnpm run build
pnpm pack --json --pack-destination "$ARCHIVES"
# Set ARCHIVE to the actual .tgz path returned by pack.
pnpm --dir "$CLI_HOST" add --ignore-scripts "$ARCHIVE"
CLI="$CLI_HOST/node_modules/svelte-ui-kit/dist/cli/main.js"
```

Use Node `24.21.0` and pnpm `11.22.0` for the qualified baseline. In the
application, explicitly install the reported runtime dependencies. For the
complete current catalog the tested runtime pins are:

```sh
pnpm --dir "$APP" add svelte@5.57.1 @internationalized/date@3.12.4
# From APP, extract the native dependency from the actual packed CLI archive.
cd "$APP"
test ! -L vendor && mkdir -p vendor && test -d vendor
NATIVE_ARCHIVE=bits-ui-2.19.5-svelte-ui-kit.2.tgz
test ! -e "vendor/$NATIVE_ARCHIVE" && test ! -L "vendor/$NATIVE_ARCHIVE" && \
  tar -xOf "$ARCHIVE" "package/dist/native/$NATIVE_ARCHIVE" > "vendor/$NATIVE_ARCHIVE"
shasum -a 256 "vendor/$NATIVE_ARCHIVE"
# Proceed only if the digest matches the exact value below.
pnpm add "./vendor/$NATIVE_ARCHIVE"
```

The native archive must have SHA-256
`1384075b9d764f80b92a94e378f233c2382dd6125fb3c301ae46be6d7746e603`.
Its distinct local Bits version is built from the pinned upstream source with
the narrow declaration-emitter correction in the portable producer recipe.
Keep the regular archive inside the application and retain its explicit file
declaration and dependency lockfile in the application's delivery system.
The application must continue checking and building after its CLI host and
authoring clone disappear. Unknown, changed, escaping or linked native archives
and changed installed distributions are refused; recopy and reinstall explicitly.

The app supplies its SvelteKit/check/build tooling separately; the
[consumer manifest](tests/fixtures/consumer/package.json) records the tested
tooling pins. The CLI never installs packages or changes the app manifest.
When redistributing copied source, retain the distribution's `NOTICE.md`,
`LICENSE-MIT` and `LICENSE-APACHE` in your application's source notices.
Installing the kit in `CLI_HOST` does not add a kit runtime dependency to `APP`.

For a fresh clone, prepare the authenticated native artifact and maintained
consumer copy before installing the frozen development dependencies:

```sh
node tools/prepare-native-dependency.mjs --fixture
pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict
```

Preparation is developer tooling. It does not run inside the installed CLI or
change application package files. Builds authenticate its cache and bundle the
native archive into compiler staging before local packing.

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

These current requests use actual bundled items:

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

For interrupted writes, follow the [qualified recovery procedures](implementation/OPERATIONS_RUNBOOK.md#interrupted-writes):
stop writers, preserve an external backup including hidden transaction evidence,
and diagnose without mutation. A verified dead owner's coordination directory
can be quarantined only after the documented prerequisites; journals are never
blindly cleared. Uncommitted post-crash edits cause refusal and remain intact;
committed cleanup preserves subsequent edits. Corrupt or ambiguous evidence
requires stopping for review.

For a reviewed incoming local archive, install it in a separate CLI host and
set `INCOMING_CLI` to that installed executable. Inspect and apply the upgrade:

<!-- documented-upgrade-workflow:start -->

```sh
node "$INCOMING_CLI" --cwd "$APP" view button --source
node "$INCOMING_CLI" --cwd "$APP" sync --dry-run
node "$INCOMING_CLI" --cwd "$APP" sync
node "$INCOMING_CLI" --cwd "$APP" doctor --strict
```

<!-- documented-upgrade-workflow:end -->

Keep theme overrides in the app-owned stylesheet, such as
`:root { --kit-color-primary: rgb(12, 34, 56); }`. Valid source customization is
reported separately from missing/broken source. A genuine local/incoming
conflict exits 10 and stops the entire batch. Back up and review both versions;
deliberately reconcile the app source, then rerun dry sync, sync, strict doctor
and the app's check/build/browser scripts. The CLI supplies neither a merge base
nor an automatic merge. Do not alter baseline hashes to conceal edits.

To retire requests, edit only the desired `requested` list in `_kit/kit.json`
and review `sync --dry-run`. Dependencies still needed by surviving requests
remain. A clean retired target is removed; a customized target is retained and
detached with diagnostics. `RETIRED_IMPORTS_REVIEW_REQUIRED` means application
imports may need manual repair even when sync exits 0. Inspect every retired
import and rerun application verification; a successful CLI transaction is not
a promise that arbitrary application imports were rewritten.

`pnpm run test:package` creates and inspects a local tarball without publication;
its extracted executable uses bundled assets without an authoring-tree fallback.

### App-owned composition examples

The [example page](tests/fixtures/qualification/composition-examples/+page.svelte)
composes existing local flat exports into independent disclosure questions,
a native form with application-owned Alert/Status feedback, native Anchor and
RouterLink navigation, and a Dialog portaled into a themed application host.
The application owns disclosure state, validation, submitted data, message
content, URL destinations and theme properties. There is no notification queue,
accordion coordinator, data grid or additional registry API.

Request `field`, `checkbox`, `button`, `anchor`, `router-link`, `alert`, `status`,
`collapsible` and `dialog` with the existing `add` workflow. Dependencies remain
transitive. Copy the example into an application route and replace both
`__UI_MODULE__` placeholders with the relative local UI barrel import for that
route and configured mapping. Keep the portal host inside the desired theme
scope. The fixture builder performs those substitutions against actual
CLI-installed sources in both default and custom layouts; it retains the page,
generated sources and production output hashes. Run the example qualification:

```sh
pnpm run build
pnpm exec playwright test --config playwright.config.ts tests/browser/composition-examples.spec.ts
```

The maintained consumer contains no installed registry catalog, so the
app-owned example template lives beside the other isolated qualification pages.
The owning lane checks and builds each generated consumer before testing its
real production handler, keyboard interactions, semantic feedback and live theme.

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
at `/compatibility`) that exercises `bits-ui 2.19.5-svelte-ui-kit.2`
`Switch.Root`/`Switch.Thumb` with `bind:checked`, `bind:ref` and a real `child`
snippet forwarding a delegated native button. `pnpm run test:components` runs
the typed component suite: it type-checks the maintained component and proves
incompatible `checked`/`ref`/`child` examples fail `svelte-check` for their
intended diagnostics in disposable copies. The fixture pins `csstype 3.1.3`
(an undeclared transitive type dependency of the upstream declarations).
The maintained fixture uses `strict` and `skipLibCheck: false`. Its audit requires
raw checker exit zero with zero errors/warnings and authenticates the native
source and distribution. Authored and dependency defects, tool failures and
malformed machine records remain refusal controls.

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

The [filesystem platform matrix](implementation/evidence/PLATFORMS.md) records
separate local macOS and isolated Linux transaction/recovery evidence. It does
not establish Linux browser support. Windows remains unqualified, and configured
remote CI lanes remain unexecuted evidence.

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
