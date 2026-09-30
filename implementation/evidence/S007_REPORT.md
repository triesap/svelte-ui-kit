# S007 step report — Add an SSR-enabled SvelteKit consumer fixture

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S007","kind":"report","commit":"99212955c2b812ef6bc525c9cdca14fae4e6499a","disposition":"candidate"}
-->

Step ID and title: S007 — Add an SSR-enabled SvelteKit consumer fixture.

This report covers the initial fixture implementation and the R1/R2 corrections
requested by the independent review in
`implementation/evidence/S007_REVIEW.md`. It also records the authorized
`committed_pending_review` governance-tool extension required before the first
`pfc through RCLD-01` commit. The report remains a candidate; it is not a Codex
acceptance claim. The existing independent review is preserved unchanged.

Contract/requirement IDs: R20, R21, R29, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/ACCEPTANCE_CRITERIA.md`,
`specs/API_CONTRACTS.md`, `specs/ARCHITECTURE.md`,
`specs/COMPONENT_CATALOG.md`).

Candidate state: S007 was `in_progress` while this report was authored and is
now `committed_pending_review` at
`99212955c2b812ef6bc525c9cdca14fae4e6499a`. Independent Codex review follows
the batch; no completion or acceptance is claimed.

Actual target root and branch: this repository (`.`) on branch `master`.
Starting commit / baseline: `bce30a4b7b5bf0e885d9991719f807cfda98ad63`
(`master`, S006). The four Codex S006 bookkeeping files
(`implementation/COMMIT_SEQUENCE.md`, `implementation/COMMIT_SEQUENCE.json`,
`implementation/evidence/S006_REPORT.md`,
`implementation/evidence/S006_REVIEW.md`) were present as unstaged
post-commit bookkeeping and were preserved with their accepted S006 hashes and
dispositions.

Author/provider: Pi, provider `ollama`, model `deepseek-v4.1-flash:cloud`.
Runtime: Node `24.21.0` with `pnpm 11.22.0`. No global tool or package-manager
configuration was changed and the provider/model was not substituted.

## Review corrections

### S007-R1 — bounded lifecycle and observable failures

- The owned-server boundary now lives in `tests/smoke/owned-server.mjs`. It
  records stderr continuously and records the child exit event through
  teardown. `failure()`/`assertAlive()` report an unexpected exit or any
  unexpected stderr; `stop()` marks the shutdown intentional, sends `SIGTERM`,
  waits a bounded interval, then `SIGKILL`s only its own child. The shared
  server is checked after every test (`afterEach`) and again in `after`, so a
  post-ready exit with code 17 fails the suite even when no later request uses
  the dead server.
- `fetchRoute` uses one `AbortController` deadline covering the response
  headers and the full body. The diagnostic names the phase that stalled
  (`response headers` or `response body`) and the elapsed time.
- `tests/smoke/fault-server.mjs` is a maintained deterministic fault launcher.
  `tests/smoke/owned-server.test.mjs` drives startup failure, error stderr,
  post-ready exit 17, stalled headers, stalled body, HTTP 500, wrong content
  type, assertion-failure cleanup, and both launcher operands.
- The launcher's advertised default operand was corrected from
  `../../fixtures/consumer/build/handler.js` (outside `tests/`) to
  `../fixtures/consumer/build/handler.js`. The default path is exercised by the
  maintained suite and an explicit-operand test.
- Disposable copies register `t.after` cleanup immediately after base
  allocation, before `cpSync`/`symlinkSync`; a synchronous setup failure also
  removes the owned base before rethrowing. A control test proves a failed
  setup leaves no owned directory.

### S007-R2 — specific SSR-disabled failure

- `tests/smoke/ssr-assertions.mjs` asserts HTTP 200 and an HTML content type
  independently (`assertHtmlTransport`) before any markup assertion. The
  SSR-disabled control calls it first, so an HTTP 500 or a wrong content type
  fails the transport assertion rather than satisfying the negative case.
- `missingSsrMarkupError` returns a specific `missing visible SSR markup`
  error. The negative control requires that specific error; a real
  SSR-disabled build passes the transport assertions and fails only the
  missing-markup assertion.
- Independent fault-server probes (`serve-500`, `serve-plain`) prove the
  transport assertion rejects both false-pass probes. Both are recorded in
  `tests/smoke/owned-server.test.mjs`.

## Owner-authorized batch validator extension

`tools/check-contracts.mjs` now parses one live `<!-- checkpoint-batch ... -->`
record (fenced examples inert) and admits the new `committed_pending_review`
status only for the exact approved `RCLD-01` `S007`–`S012` `pfc` /
`codex-after-sequence` authorization. Invalid, duplicate, unknown-field,
wrong-mode, wrong-sequence and widened-range records are rejected. A pending
checkpoint must record its full implementation hash in the ledger; its report
record stays `candidate` with that hash, an optional independent review stays
`changes_requested`/null, and the commit must resolve, be HEAD-reachable,
contain the report path and descend from a committed predecessor. Within-batch
pending review unlocks the next batch checkpoint only; `complete` and
`verified_uncommitted` remain Codex-reserved, `completion` stays null, and the
authored range is reported separately from the accepted counters.
`tools/check-contracts.fixtures.mjs` gained pending-review scenarios, and
`tools/check-contracts.test.mjs` added 17 focused regression tests (101 total).

## Files changed or added and purpose

| Path                                        | Change   | Purpose                                                                                                 |
| ------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------- |
| `pnpm-workspace.yaml`                       | modified | Adds exactly the explicit member `tests/fixtures/consumer` beside `"."`.                                |
| `package.json`                              | modified | Adds `fixture:check`, `fixture:build` and `test:fixture` (the latter now runs both smoke suites).       |
| `pnpm-lock.yaml`                            | modified | Adds the fixture importer and dependency graph; one root lockfile.                                      |
| `tests/fixtures/consumer/**`                | new      | Private ESM fixture app, exact approved dependency set, strict tsconfig, request-local SSR route.       |
| `tests/smoke/owned-server.mjs`              | new      | Shared owned-server lifecycle and bounded `fetchRoute` boundary.                                        |
| `tests/smoke/ssr-assertions.mjs`            | new      | Independent transport assertion and specific missing-markup error.                                      |
| `tests/smoke/fault-server.mjs`              | new      | Deterministic test-only fault launcher.                                                                 |
| `tests/smoke/consumer-fixture.test.mjs`     | new      | SSR, isolation, escaping, type-mismatch, SSR-disabled and cleanup controls.                             |
| `tests/smoke/owned-server.test.mjs`         | new      | Lifecycle, deadline, cleanup, HTTP 500/wrong-content-type and launcher controls.                        |
| `tests/smoke/consumer-fixture-server.mjs`   | new      | Production server launcher with the corrected default handler path.                                     |
| `tools/check-contracts.mjs`                 | modified | Batch authorization parser and `committed_pending_review` validation.                                   |
| `tools/check-contracts.fixtures.mjs`        | modified | Pending-review scenarios and pending-summary derivation.                                                |
| `tools/check-contracts.test.mjs`            | modified | 17 batch/pending-review regression tests.                                                               |
| `README.md`, `CONTRIBUTING.md`, `AGENTS.md` | modified | Document the corrected fixture/suite behavior and the batch guard.                                      |
| `implementation/VERIFICATION.md`            | modified | Corrected Consumer SSR lane and batch verification readiness statement.                                 |
| `implementation/evidence/COMPATIBILITY.md`  | modified | Corrected S007 addendum and batch reference-reuse policy.                                               |
| `implementation/COMMIT_SEQUENCE.md`         | modified | Separate `Committed pending review` counter/range line (ledger statuses/hashes updated per checkpoint). |

## Dependency and lockfile changes

- Root `svelte-ui-kit`: no dependency change; sixteen existing exact dev pins,
  private flag, ESM type, license, engine and packageManager preserved.
- Fixture `dependencies`: `svelte 5.57.1`.
- Fixture `devDependencies`: the seven approved exact pins (`@sveltejs/kit
2.70.3`, `@sveltejs/vite-plugin-svelte 7.3.1`, `vite 8.3.1`, `typescript
6.0.3`, `@types/node 24.19.0`, `@sveltejs/adapter-node 5.5.7`, `svelte-check
4.7.6`). Only `adapter-node` and `svelte-check` are new selections.
- Installed facts: adapter-node `5.5.7` peer `@sveltejs/kit ^2.4.0` satisfied
  by `2.70.3`; svelte-check `4.7.6` engine `>= 18.0.0`, peers `svelte ^4.0.0 ||
^5.0.0-next.0` and `typescript ^5.0.0 || ^6.0.0` satisfied by `5.57.1` and
  `6.0.3`. Both admit Node `24.21.0`.

## Verification

All commands ran from this package root under Node `24.21.0` and
`pnpm 11.22.0`, using the required execution routing after a green environment
diagnostic. Exits are real captured process exits. Logs are under the
gitignored `implementation/evidence/logs/` (`s007b-*.log`).

| Step                       | Command                                                                     | Exit | Result                                                                | Log                         |
| -------------------------- | --------------------------------------------------------------------------- | ---- | --------------------------------------------------------------------- | --------------------------- |
| Frozen strict install      | `pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict` | 0    | `Already up to date`; 2 workspace projects                            | `s007b-install-frozen.log`  |
| Fixture check              | `pnpm run fixture:check`                                                    | 0    | `svelte-check found 0 errors and 0 warnings`                          | `s007b-fixture-check.log`   |
| Fixture build + all suites | `pnpm run test:fixture`                                                     | 0    | build + `tests 16, pass 16, fail 0`                                   | `s007b-test-fixture.log`    |
| Both compiler typechecks   | `pnpm run typecheck`                                                        | 0    | `tsc -p tsconfig.json --noEmit && tsc -p tsconfig.unit.json --noEmit` | `s007b-typecheck.log`       |
| Full unit discovery        | `pnpm run test:unit`                                                        | 0    | 2 files; `totals: tests 14, pass 14, fail 0`                          | `s007b-unit.log`            |
| Unit harness               | `pnpm run test:harness`                                                     | 0    | `tests 29, pass 29, fail 0`                                           | `s007b-harness.log`         |
| CLI smoke                  | `pnpm run test:cli-bootstrap`                                               | 0    | `tests 41, pass 41, fail 0`                                           | `s007b-cli-bootstrap.log`   |
| Lint                       | `pnpm run lint`                                                             | 0    | `eslint . --max-warnings 0`; no findings                              | `s007b-lint.log`            |
| Format check               | `pnpm run format:check`                                                     | 0    | All matched files use Prettier code style                             | `s007b-format-check.log`    |
| Contract validation        | `pnpm run check:contracts`                                                  | 0    | `0 error(s), 0 warning(s)`                                            | `s007b-contracts-check.log` |
| Contract tests             | `pnpm run test:contracts`                                                   | 0    | `tests 101, pass 101, fail 0`                                         | `s007b-contracts-test.log`  |
| Whitespace (unstaged)      | `git diff --check`                                                          | 0    | No diagnostics                                                        | (terminal)                  |
| Whitespace (staged)        | `git diff --cached --check`                                                 | 0    | No diagnostics; nothing staged                                        | (terminal)                  |

Command composition: `pnpm run test:fixture` performs the required production
`fixture:build` and then runs both smoke suites, so no duplicate final build was
run. `s007b-test-fixture.log` records `tests 16, pass 16`.

### Fault-control and negative-control coverage

`tests/smoke/owned-server.test.mjs` (11 tests) and the two control tests in
`tests/smoke/consumer-fixture.test.mjs` prove:

- startup failure rejects readiness with the captured stderr;
- unexpected server stderr is an observable failure;
- a post-ready exit with code 17 fails `assertAlive`;
- stalled response headers and a stalled response body both hit the request
  deadline and name the stalled phase;
- an HTTP 500 and a `text/plain` response are rejected by
  `assertHtmlTransport`;
- an assertion failure after startup still stops the owned server;
- a failed disposable-copy setup synchronously removes its owned directory;
- the launcher resolves both its corrected default path and an explicit
  handler operand.

## Cleanup evidence

Each suite owns its server and copies. The shared and explicit servers are
stopped in `after`/`finally`; the shared server's health is checked after every
test and before it is stopped. Disposable copies are registered with `t.after`
immediately after allocation, and a failed setup removes its base synchronously.
No `suik-consumer-*` temporary directory and no `consumer-fixture-server`/
`fault-server` process remains after the suite. Removal deletes the
`node_modules` symlink entry, never the installed packages it points at. No
unrelated process is signalled.

## Conditional reference guard (reused, not rerun)

The owner-authorized batch explicitly permits reusing the audited S007
reference guard through S011. The reference worktree was verified clean at
`a10fbf06334f4648f5755e05a7147414e4e5fc98` this session. The audited S007
evidence records `cargo fmt --all -- --check`,
`cargo check --workspace --all-targets` and
`cargo test --workspace --all-targets` at exit 0 with 562 top-level plus 16
nested passes, zero failures and four previously identified ignored tests. No
fresh Rust run is claimed and no reference source was modified. A fresh guard
runs at the S012 milestone.

## Exceptions, failed attempts and retries

- The pinned runtime (`node --version`, `pnpm --version`) was confirmed before
  mutating work.
- The first corrected-gate `pnpm run lint` exited 1 for a
  `preserve-caught-error` finding in `tests/smoke/owned-server.mjs`; attaching
  the caught error as `cause` fixed it and the next run exited 0.
- The first corrected-gate `pnpm run format:check` exited 1 for
  `implementation/evidence/COMPATIBILITY.md` and
  `implementation/VERIFICATION.md`; a scoped `prettier --write` fixed both and
  the next run exited 0.
- No assertion was weakened, no check skipped, and no failing lane reported as
  passed.

## Limitations and unverified scope

- Hand-authored qualification baseline; not evidence that the generator or an
  installed tarball produces this app.
- No browser/hydration, keyboard/focus or accessibility-audit qualification is
  claimed; S008 owns the browser harness.
- No Bits UI rendering/binding/SSR compatibility is claimed; S011 owns that.
- No package/tarball acceptance, generated-wrapper typing, cross-platform
  (non-macOS) or release-readiness lane is claimed.
- The SSR suite asserts server output before client JavaScript; hydration is
  not executed.
- Pending review is not independent acceptance; Codex reviews the sequence.

## Self-review findings

- The root manifest gains only the fixture scripts; identity, private flag,
  ESM type, license, bin, engine, packageManager and all exact pins are
  preserved, and no root runtime dependency was introduced.
- The fixture adds no Bits/date dependency and no automatic install hook.
- SSR and CSR stay enabled; the route is not prerendered; the server load is
  request-local with no shared mutable state.
- Transport success is asserted independently of visible markup; the
  missing-markup failure is specific.
- The owned-server boundary records stderr/exit through teardown and bounds
  startup, request headers/body and stop deadlines.
- Lint/format exclusions remain recursive; generated output stays ignored; no
  semantic/compiler/a11y rule was disabled.
- The four Codex S006 bookkeeping files were preserved; the reference tree is
  clean at the reviewed commit.

## Decisions requiring Codex

None blocking. All consequential choices were pre-approved; the escaping detail
(Svelte escapes `<`/`&`, not `>`) and svelte-check's human output omitting a
numeric `2322` code remain observed behavior, not compatibility deviations.

## Commit and next action

Actual commit hash: recorded in the report evidence after the S007
implementation commit (the report does not contain its own hash before that
commit exists). Commit message: `test: add the ssr consumer qualification
fixture`.

Under the owner-authorized batch, the next checkpoint is S008 (generated-app
browser harness). It is authorized to proceed after the S007 green commit;
independent Codex review of the sequence follows S012.

Is the next step safe to begin? Yes, within the authorized batch. Nothing was
pushed or published and S013 was not started.

## RCLD-01 repair addendum (2026-09-30)

Repair commit: `8f58879f86b376252125aa52ca39db0384183c6d` (not the original
pending hash above). The takeover dispatch's R1/R2 lifecycle findings are
closed:

- `startOwnedServer` now settles synchronous and asynchronous spawn failures
  (missing executable, invalid cwd) so `ready` rejects and `stop()` resolves,
  retains the first observed failure so a later `stop()` never erases a prior
  unexpected exit or error stderr, drains stdio by waiting for `close`, and
  bounds the entire termination path with a SIGKILL fallback.
- The maintained SSR suite samples server health after teardown, so
  shutdown-time stderr and post-ready exits are observed.
- The launcher default and explicit operand paths remain covered, and the
  SSR-disabled control still asserts HTTP 200 and an HTML content type outside
  the expected missing-markup failure.

Deterministic regressions in `tests/smoke/owned-server.test.mjs` cover a
missing executable, an invalid cwd, late stderr during shutdown, retention of
an observed exit 17 across `stop()`, forced SIGKILL termination and idempotent
`stop()`. Verified: owned-server 16/16, `test:fixture` 23/23, format/lint/
typecheck green.

### RCLD-01 closure-batch addendum (2026-09-30)

Repair commit `abeedd301c634461ae791618311462ffd575af23` (with the RCLD01-R2-2
browser work) makes `startFixtureServer` retain ownership of its child until
readiness succeeds, stop and drain it on every rejected readiness path before
rethrowing the original diagnostic, and retain cleanup and observed failures on
an `AggregateError`. The owned-server child environment now drops a conflicting
`FORCE_COLOR` only when `NO_COLOR` is present, preserving the parent and strict
stderr checks. Added ownership controls cover malformed readiness, readiness
timeout, spawn failure and successful startup/shutdown in the browser lane.
Verified: browser 22/22, SSR/lifecycle 23/23.
