# S008 step report — Add the generated-app browser harness

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S008","kind":"report","commit":"f4dfa83aadc67850b6b8b999f80bd7199de4a6b2","disposition":"candidate"}
-->

Step ID and title: S008 — Add the generated-app browser harness.

Contract/requirement IDs: R21, R22, R29, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/ACCEPTANCE_CRITERIA.md`,
`specs/ARCHITECTURE.md`, `specs/COMPONENT_CATALOG.md`).

Author: Pi, provider `ollama`, model `deepseek-v4.1-flash:cloud`. Runtime:
process-local Node `24.21.0` / `pnpm 11.22.0`, after `cargo extbuild doctor`
(exit 0) and with mutating commands routed through `cargo extbuild run --`.

Under the owner-authorized batch this report is `committed_pending_review` at
`f4dfa83aadc67850b6b8b999f80bd7199de4a6b2` pending independent Codex review.
No completion or acceptance is claimed.

## Dispatch mapping

| #   | Dispatch decision           | Implementation                                                                                                                                                                                                                                                                       | Evidence                                                                           |
| --- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| 1   | Approved dependency         | Exactly `@playwright/test 1.63.0` added to root `devDependencies`; installed document declares `>=20` and dependency `playwright 1.63.0`. Existing pins unchanged.                                                                                                                   | `package.json`, `pnpm-lock.yaml`, frozen strict install exit 0                     |
| 2   | Initial lane and runner     | Bundled headless Chromium on macOS/Node 24.21.0; Playwright's real runner/config `playwright.config.ts`; `tests/browser/harness.spec.ts`; root `test:browser` builds the fixture then runs with explicit operands. Explicit `pnpm exec playwright install chromium`.                 | `playwright.config.ts`, `tests/browser/harness.spec.ts`, `package.json`            |
| 3   | Owned server and error gate | Reuses `tests/smoke/owned-server.mjs` (loopback, OS-assigned port, bounded startup/request/teardown). Page exceptions, console errors and hydration warnings are collected; the shared server's stderr/exit is checked after every test and at teardown. A control proves detection. | `tests/browser/harness.spec.ts`, `tests/smoke/owned-server.mjs`                    |
| 4   | Real interactions           | Accessible heading/labels, Tab and Shift+Tab focus order, native checkbox Space activation, form navigation with a request-time query update, and a fixture-only `$state` counter that proves hydration. Accessible locators only; no fixed sleep.                                   | `tests/browser/harness.spec.ts`, `tests/fixtures/consumer/src/routes/+page.svelte` |
| 5   | Docs and platform           | README/CONTRIBUTING/VERIFICATION/COMPATIBILITY document setup, the exact tested platform and the remote-only limits.                                                                                                                                                                 | Those files                                                                        |

## Files changed or added

| Path                                                                                                         | Change   | Purpose                                                            |
| ------------------------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------ |
| `package.json`                                                                                               | modified | Adds `@playwright/test 1.63.0` and the `test:browser` script.      |
| `pnpm-lock.yaml`                                                                                             | modified | Playwright importer/package graph.                                 |
| `playwright.config.ts`                                                                                       | new      | Playwright runner/config; ignored failure output.                  |
| `tests/browser/harness.spec.ts`                                                                              | new      | Six browser tests plus the error-gate control.                     |
| `tests/fixtures/consumer/src/routes/+page.svelte`                                                            | modified | Fixture-only `$state` counter, `data-hydrated` marker and handler. |
| `.gitignore`, `.prettierignore`, `eslint.config.mjs`                                                         | modified | Ignore `tests/browser/.output/` and `playwright-report/`.          |
| `README.md`, `CONTRIBUTING.md`, `implementation/VERIFICATION.md`, `implementation/evidence/COMPATIBILITY.md` | modified | Browser setup, lane meaning, platform and limits.                  |
| `implementation/COMMIT_SEQUENCE.md`                                                                          | modified | S007 recorded as pending review; S008 active.                      |

## Verification

All commands ran from the package root under Node `24.21.0`/`pnpm 11.22.0`,
routed through `cargo extbuild run --`. Exits are real captured process exits;
logs are under `implementation/evidence/logs/` (`s008-*.log`).

| Step                      | Command                                                                     | Exit | Result                                    | Log                           |
| ------------------------- | --------------------------------------------------------------------------- | ---- | ----------------------------------------- | ----------------------------- |
| Lock-generating install   | `pnpm install --engine-strict --strict-peer-dependencies`                   | 0    | `+ @playwright/test 1.63.0`               | `s008-install.log`            |
| Frozen strict install     | `pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict` | 0    | `Already up to date`                      | `s008-install-frozen.log`     |
| Chromium install          | `pnpm exec playwright install chromium`                                     | 0    | pinned browser available                  | `s008-playwright-install.log` |
| Scoped browser lane       | `pnpm run test:browser -- tests/browser/harness.spec.ts`                    | 0    | `6 passed` (bundled Chromium)             | `s008-browser.log`            |
| Fixture check             | `pnpm run fixture:check`                                                    | 0    | 0 errors, 0 warnings                      | `s008-fixture-check.log`      |
| S007 SSR suite (affected) | `pnpm run test:fixture`                                                     | 0    | build + `tests 16, pass 16, fail 0`       | `s008-test-fixture.log`       |
| Lint                      | `pnpm run lint`                                                             | 0    | no findings                               | `s008-lint.log`               |
| Format check              | `pnpm run format:check`                                                     | 0    | All matched files use Prettier code style | `s008-format-check.log`       |
| Both compiler typechecks  | `pnpm run typecheck`                                                        | 0    | exit 0                                    | `s008-typecheck.log`          |
| Contract validation       | `pnpm run check:contracts`                                                  | 0    | 0 error(s), 0 warning(s)                  | (S008 gate rerun)             |

The earlier browser attempt failed once at the hydration test because the
counter button had no `onclick` handler and, separately, the harness initially
ran interactions before hydration; both were corrected (handler added, and the
`data-hydrated` marker awaited). The final lane is 6/6.

## Error-gate controls

The harness collects `pageerror`, console `error` and `/hydration/i` console
`warning` events. A dedicated test injects `console.error`, a synthetic
`hydration_mismatch` warning and an async thrown page error, then asserts the
collector records all three. This proves the gate detects — rather than
blanket-ignores — those signals. Unexpected owned-server stderr or exit fails
the per-test and teardown health checks.

## Platform and limitations

- Qualified lane: bundled headless Chromium on macOS with Node 24.21.0 only.
  No Firefox/WebKit, no alternate Chromium channel and no Windows claim.
- No remote CI execution is claimed; the S010 workflow is not yet committed.
- Production builds strip Svelte's dev-only hydration diagnostics, so the
  hydration-warning branch is proven by a control, not a naturally mismatching
  page.
- No Bits UI integration, tarball acceptance or release readiness is claimed.

## Self-review findings

- Only the approved exact dependency was added; no existing pin changed.
- The browser lane starts only its own server and stops it in `afterAll`; the
  process is bounded and no unrelated listener is signalled.
- No fixed sleeps or screenshot-only assertions are used; the hydration wait
  uses a DOM marker and expectations auto-wait.
- The fixture counter is fixture-only and does not introduce a product API.
- The affected S007 SSR suite and fixture check still pass after the fixture
  change.

## Commit and next action

Commit message: `test: establish the consumer browser harness`. The commit hash
is recorded in this report's evidence after the commit (no self-referential
hash is amended before it exists). Next checkpoint: S009, authorized to proceed
after the S008 green commit. Nothing was pushed or published and S013 was not
started.
