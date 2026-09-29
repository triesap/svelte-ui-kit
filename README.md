# svelte-ui-kit

Source-first UI kit for Svelte with installable component source and a CLI.

## Status

Bootstrap. The repository currently provides the pinned development toolchain,
contract validation, and a minimal CLI that implements only `--help`/`-h` and
`--version`/`-V`. Component install/inspect/update commands are planned but not
implemented yet.

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
pnpm run test:harness
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

The CLI entrypoint is `src/cli/main.ts`, compiled with the pinned `tsc` to
`dist/cli/main.js` (build output is ignored and never committed).

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
header/body and cleanup faults. This is a hand-authored qualification baseline
only: it is not evidence that the future generator or an installed tarball
already produces this app, and no browser/hydration or release qualification is
claimed.

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
