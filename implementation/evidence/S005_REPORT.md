# S005 step report — Add a real unit-test harness

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S005","kind":"report","commit":null,"disposition":"implemented"}
-->

Step ID and title: S005 — Add a real unit-test harness.
Codex review 2 accepts S005 as verified_uncommitted with R1–R3 closed; see
[S005_REVIEW.md](S005_REVIEW.md). The initial return and correction chronology
below remain historical. Actual checkpoint commit is pending; S006 unlocks
only after it is recorded.
Contract/requirement IDs: R29, R30, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/`).
Actual target root and branch: this repository (`.`) on branch `master`.
Starting commit / baseline status:
`fd5d5162c7e5e3fa22fcc8a0365525f4e0e6a100` (`master`, S004 complete). The
working tree already held the four expected unstaged Codex post-commit
bookkeeping files (`implementation/COMMIT_SEQUENCE.md`,
`implementation/COMMIT_SEQUENCE.json`, `implementation/evidence/S004_REPORT.md`,
`implementation/evidence/S004_REVIEW.md`); they were preserved unchanged, with
their accepted dispositions and real S004 hash intact.

Author/provider: Pi, provider `ollama`, model `deepseek-v4.1-flash:cloud`.
Runtime used for target tooling: process-local Node `24.21.0` with
`pnpm 11.22.0`, using the required execution routing after successful
environment diagnostics (exit 0). No global tool or
package-manager configuration was changed.

## Implemented

S005 establishes a typed, fail-closed unit-test harness. It adds a unit
TypeScript configuration, a dependency-free Node runner that compiles before
executing, a typed CLI bootstrap unit test, focused runner regression tests and
the scheduled contract-fixture isolation correction. It adds no dependency and
preserves the S004 product build, `dist` CLI behavior, `test:cli-bootstrap`
smoke and contract validator semantics.

Files changed or added and purpose:

| Path                                     | Change                                                                                                                                                                                                    |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tsconfig.unit.json`                     | New. Extends the strict root config; overrides `rootDir` to `.`, `outDir` to `.unit-test-build`, and includes `src/**/*.ts` and `tests/unit/**/*.ts`. No `skipLibCheck`, `any` or disabled check.         |
| `tools/run-unit-tests.mjs`               | New. Dependency-free runner: deterministic discovery / explicit operands, guarded owned-output cleanup, compile-before-run, structured per-file fail-closed results, explicit counts and nonzero exit.    |
| `tests/unit/cli-bootstrap.test.ts`       | New. Typed unit test resolving the product `bin` from the root manifest and invoking the real `dist` CLI (never the `.unit-test-build` mirror).                                                           |
| `tools/run-unit-tests.test.mjs`          | New. Focused runner regression suite over disposable package fixtures, including empty/empty-suite/skipped/TODO/assertion/import/compile negatives and cleanup/nested-runner guards.                      |
| `package.json`                           | Adds `test:unit` (`pnpm run build && node tools/run-unit-tests.mjs`), `test:harness` (`node --test tools/run-unit-tests.test.mjs`) and extends `typecheck` to check both configurations without emitting. |
| `.gitignore`, `.prettierignore`          | Ignore the owned `.unit-test-build/` output tree.                                                                                                                                                         |
| `tools/check-contracts.fixtures.mjs`     | `buildFixture` accepts an optional owned temporary parent (default remains the ordinary temporary directory); construction-failure cleanup is unchanged.                                                  |
| `tools/check-contracts.test.mjs`         | Replaces the global-directory leak diff with owned-allocation assertions; adds an unrelated-live-fixture case and a retained-owned-fixture leak-detection case.                                           |
| `README.md`, `CONTRIBUTING.md`           | Document `test:unit`/`test:harness`, deterministic selection, explicit operands and the fail-closed empty-selection behavior.                                                                             |
| `implementation/VERIFICATION.md`         | Updates the Unit command row to the implemented behavior and adds a Unit harness row.                                                                                                                     |
| `implementation/evidence/S005_REPORT.md` | This candidate report.                                                                                                                                                                                    |

Unchanged as required: `pnpm-lock.yaml` and `pnpm-workspace.yaml` are
byte-unchanged (no new dependency, no lockfile/workspace edit); `.node-version`,
the engine, package manager, all nine exact `devDependencies`, ESM, `private`,
license and repository metadata are preserved; `src/cli/main.ts`,
`tests/smoke/cli-bootstrap.test.mjs` and the contract validator are untouched.
`dist/` and `.unit-test-build/` are gitignored and uncommitted.

### Harness contract as implemented

- **Selection.** With no operands the runner discovers every regular
  `tests/unit/**/*.test.ts` file in sorted order. It accepts one optional
  leading `--` followed by explicit repository-relative `*.test.ts` operands.
  Missing files, globs/braces, directories, unknown options, non-`.test.ts`
  files and paths/symlinks escaping `tests/unit` are rejected with exit 1 and an
  empty stdout; there is no silent fallback to the full suite.
- **Compile-before-run, stale-output safety.** The fixed owned
  `.unit-test-build` tree is removed with a guard that refuses a symlinked or
  non-directory root, then `tsconfig.unit.json` is compiled with the installed
  `tsc`. A compile failure stops execution before any test runs, so a previous
  build can never satisfy a later failing compile. Compiled `.js` counterparts
  run with the package root as the working directory.
- **Fail-closed results.** Results come from structured `node:test` `run()`
  events with process isolation. Every selected file must produce a completed
  per-file summary with at least one executed, non-skipped/non-TODO test and no
  failures, cancellations or missing/abnormal summaries. An empty file yields a
  passing file wrapper without a per-file summary and therefore fails. Suites
  and leaf tests are reported separately, and any failure propagates to a
  nonzero process exit.

## Verified

Executed mutating dependency/build/test commands ran under process-local Node
`24.21.0` and pnpm `11.22.0` after successful environment
diagnostics (exit 0), using the required execution routing.
Working directory for target commands was this package root; the reference guard
ran from the reference workspace root. Exits are real process exits. Per-attempt
logs are kept under the gitignored `implementation/evidence/logs/` directory and
are not committed.

| Step                  | Command                                                                     | Exit | Result                                                          |
| --------------------- | --------------------------------------------------------------------------- | ---- | --------------------------------------------------------------- |
| Frozen strict install | `pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict` | 0    | `Already up to date`; lock/workspace bytes unchanged            |
| Typecheck (both)      | `pnpm run typecheck`                                                        | 0    | No diagnostics for `tsconfig.json` or `tsconfig.unit.json`      |
| Build                 | `pnpm run build`                                                            | 0    | `dist/cli/main.js`, shebang preserved                           |
| Unit (default)        | `pnpm run test:unit`                                                        | 0    | 1 file; `tests 5`, `pass 5`, `fail 0`; per-file summary present |
| Unit (explicit)       | `pnpm run test:unit -- tests/unit/cli-bootstrap.test.ts`                    | 0    | Same 1 file, 5/5 pass                                           |
| Unit harness          | `pnpm run test:harness`                                                     | 0    | `tests 13`, `pass 13`, `fail 0`, `skipped 0`                    |
| CLI smoke             | `pnpm run test:cli-bootstrap`                                               | 0    | `tests 41`, `pass 41`, `fail 0`, `skipped 0` (41-test smoke)    |
| Contract validation   | `pnpm run check:contracts`                                                  | 0    | `0 error(s), 0 warning(s)`                                      |
| Contract tests        | `pnpm run test:contracts`                                                   | 0    | `tests 84`, `pass 84`, `fail 0`, sequential                     |
| Format check          | `pnpm run format:check`                                                     | 0    | All matched files use Prettier code style                       |
| Git whitespace        | `git diff --check` / `git diff --cached --check`                            | 0    | No diagnostics; nothing staged                                  |

Log locations (gitignored): `s005-install-frozen.log`, `s005-typecheck.log`,
`s005-build.log`, `s005-unit-default.log`, `s005-unit-explicit.log`,
`s005-harness.log`, `s005-cli-bootstrap.log`, `s005-contracts-check.log`,
`s005-contracts-test.log`, `s005-format-check.log`,
`s005-format-check-fail-1.log`, `s005-reference-{fmt,check,test}.log` and
`s005-overlap-{1,2}.log`.

### Positive harness evidence

- Default discovery selects `tests/unit/a.test.ts` then `tests/unit/b.test.ts`
  deterministically (byte-identical stdout across two runs) and passes.
- Explicit operand (with and without the optional leading `--`) runs only the
  requested file; a failing sibling is not executed and a failing explicit
  operand is reported and identified by name (`fixture fails`).
- A test file under a directory with spaces is discovered and runs both by
  discovery and by explicit operand.
- The typed `tests/unit/cli-bootstrap.test.ts` resolves `./dist/cli/main.js`
  from the manifest `bin`, asserts it is under `dist/` and not under
  `.unit-test-build/`, and proves `--version`, `-V`, `--help` and a rejected
  argument's exit/stdout/stderr contract (5 executed tests).

### Negative / fail-closed harness evidence

Every negative fixture runs through the real runner in a disposable package and
is asserted to fail for its intended reason (not an unrelated setup crash):

| Case                                       | Result                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------- |
| Missing operand                            | exit 1, `test file not found`, empty stdout (no fallback)                 |
| Glob / directory / unknown option / escape | exit 1 with the specific diagnostic, empty stdout                         |
| No discovered files                        | exit 1, `no unit test files were discovered`                              |
| Empty file beside a passing file           | exit 1, `no completed per-file summary`; sibling still passes             |
| Empty suite (`describe` with no tests)     | exit 1, `no tests executed (empty suite)`                                 |
| Skipped/TODO-only selection                | exit 1, `no executed non-skipped/non-TODO tests (skipped or TODO only)`   |
| Named assertion failure                    | exit 1, `FAIL … (… : fixture fails)`                                      |
| Import failure                             | exit 1, file-level failing event; no selection/setup diagnostic           |
| TypeScript error after a green build       | exit 1, `unit TypeScript compilation failed`; stale compiled file removed |
| Symlinked `.unit-test-build` root          | exit 1, `refusing to clean symlinked unit-build output`; target untouched |

The empty-file case is the Codex-confirmed false-green: an empty Node test file
emits a passing file wrapper but no per-file summary, and the runner fails it
even when a real passing file is selected alongside it. The TypeScript-error
case proves the runner removes stale owned output before a failing compile,
because there is no compiled file left to run. A valid restore returns the lane
to green.

### Contract-fixture isolation evidence

- `buildFixture` now accepts an optional `ownedTempParent` (default unchanged:
  the ordinary temporary directory). The construction-failure test creates its
  own parent, asserts the parent is empty afterward, and asserts an unrelated
  live `suik-contracts-*` fixture still exists.
- A second test proves the detection logic: a deliberately retained owned
  fixture is the only entry reported in its owned parent, then cleanup returns
  the parent to empty.
- Construction-failure cleanup, lifecycle-independent scenarios and
  fixture-owned Git histories are preserved; the validator's semantics and all
  other tests are unchanged.
- After the fix, two `pnpm run test:contracts` processes were run concurrently:
  both exited 0 with `tests 84`, `pass 84`, `fail 0`, and both executed the new
  owned-allocation test. Logs `s005-overlap-1.log` and `s005-overlap-2.log`.
  Suites were run sequentially until the fix was established.

### Conditional reference guard — fresh

Verified the reference worktree clean at
`a10fbf06334f4648f5755e05a7147414e4e5fc98` before the guard; no reference
source was modified. Commands ran from the reference workspace root using the
required execution routing after successful environment diagnostics (exit 0).

| Step | Command                                 | Exit | Result                                                                 |
| ---- | --------------------------------------- | ---- | ---------------------------------------------------------------------- |
| R1   | `cargo fmt --all -- --check`            | 0    | No diffs                                                               |
| R2   | `cargo check --workspace --all-targets` | 0    | `Finished dev profile`                                                 |
| R3   | `cargo test --workspace --all-targets`  | 0    | 578 passed (562 top-level + 16 nested subprocess); 0 failed; 4 ignored |

The four ignored tests are
`installed_binaries_run_after_package_source_and_build_state_are_deleted`,
`homepage_fixture_cli_workflow_smoke`,
`tests::every_transaction_io_fault_avoids_partial_application_state`, and
`packaged_sources_build_with_cargo_vcs_provenance_outside_and_inside_hostile_git`.
They remain ignored and are not claimed as executed. Raw output is in
`s005-reference-fmt.log`, `s005-reference-check.log` and
`s005-reference-test.log`.

## Exceptions

Failures and retries:

- The first `pnpm run format:check` after implementation exited 1, reporting
  `implementation/VERIFICATION.md`, `tools/run-unit-tests.mjs` and
  `tools/run-unit-tests.test.mjs`. A scoped `prettier --write` fixed exactly
  those files, and the subsequent `format:check` exited 0. A later
  `format:check` again exited 1 for this report before its scoped write;
  preserved as `s005-format-check-fail-1.log`.
- The first two-process overlap attempt was an operator shell-scripting error
  (a shell variable was not visible to the second background subshell, so the
  log path was empty and both wrappers reported exit 1 without running the
  suite). It is not a suite failure; the corrected two-process run exited 0 in
  both processes.
- An `node:test` structured-event probe and a temporary empty
  `tests/unit/__empty_probe.test.ts` confirmed the empty-file behavior, and a
  temporary appended type error in the real `tests/unit/cli-bootstrap.test.ts`
  confirmed the compile-stop behavior; both temporary changes were reverted
  without commit. No failure fixture remains in the real `tests/unit` tree.

Skipped checks: none. No S006 lint, consumer, SSR/browser, package or
publication lane belongs to this checkpoint and none was run or claimed.

Unverified behavior and release impact: component rendering, SSR/hydration,
browser qualification, lint, `svelte-check`, package/tarball acceptance and the
CLI command envelope/exit map (S022–S023) do not exist and are not claimed. No
human release test is due.

Deviations with record ID and repository evidence: none. No `any`, disabled
check, `skipLibCheck`, weakened type, suppressed failure or new dependency was
introduced.

Unresolved issues after completion: none known within S005 scope. The dispatch's
consequential decisions are all resolved.

## Self-review findings

- `package.json` diff adds only the two scripts and the extended `typecheck`;
  `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.node-version`, engine, package
  manager and all dependency pins are byte-unchanged.
- `tsconfig.unit.json` matches the dispatch exactly and inherits the strict root
  config; the product `tsconfig.json` is untouched, so S004's build and CLI
  behavior are preserved (smoke 41/41 green).
- The runner never reads success from output text or a cumulative count alone;
  it requires the structured per-file summary plus at least one executed test.
- The unit bootstrap resolves and invokes the real `dist` CLI and asserts it is
  not the `.unit-test-build` mirror.
- The isolation change is confined to fixture ownership plumbing; validator
  semantics and all other contract tests are unchanged.
- Codex's four bookkeeping files remain modified but were not edited by this
  step; their accepted S004 hash and dispositions are intact, and
  `implementation/COMMIT_SEQUENCE.md` / `.json` still record S004 `complete` and
  S005 `in_progress`.

## Commit and next action

Actual commit hash: pending; this report is candidate evidence with a null
commit. Authorized message: `test: establish the unit verification harness`.

Structured `checkpoint-evidence` record: report `candidate`, null commit (above);
no review is authored by Pi and no acceptance is claimed.

Requirements/test evidence updated: this report, the README/CONTRIBUTING
developer guidance and `implementation/VERIFICATION.md`. The governing ledger
and JSON projection are unchanged by this step (S005 remains `in_progress`,
projection validates read-only).

Next step ID: S006 — Add nonmutating formatting and lint gates. It remains locked
until Codex independently reviews and accepts S005 and commits it.

Is the next step safe to begin? No. S005 is returned unstaged/uncommitted with
S005 `in_progress`; S006 and all successors remain locked.

### Decisions requiring Codex

None blocking. All consequential S005 choices were pre-approved by the dispatch
and implemented without substitution, weakened checks or dependency changes.

## Correction dispatch — S005 review 1 (R1–R3)

Appended 2026-09-29. Author Pi, provider `ollama`, model
`deepseek-v4.1-flash:cloud`, process-local Node `24.21.0` with pnpm `11.22.0`.
This section supersedes the candidate claims above for the corrected behaviour;
the earlier text is retained as historical evidence. Codex review 1 requested
R1–R3 in `implementation/evidence/S005_REVIEW.md` and the governing S005
correction dispatch. Both prior fixture-isolation and accepted S004 evidence are
preserved. No checkpoint was advanced.

### What changed

| Path                                     | Change                                                                                                                                                                                                                                                                  |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools/run-unit-tests.mjs`               | R1 package-anchored selection/cleanup boundaries, non-following output guard; R2 ephemeral discovered-entry compiler configuration; R3 `entryFile` attribution, structured failure rendering and strict aggregate/TODO policy.                                          |
| `tools/run-unit-tests.test.mjs`          | Disposable regressions for every dispatched case (symlinked roots/ancestors/finals, absolute/parent operands, dangling output link, sentinel/stale preservation, dot-name agreement, imported diagnostics, TODO parity, timeout cancellation, abnormal exit, restores). |
| `README.md`, `CONTRIBUTING.md`           | Developer guidance for the corrected selection, compilation and failure policy.                                                                                                                                                                                         |
| `implementation/VERIFICATION.md`         | Corrected Unit and Unit harness command meanings.                                                                                                                                                                                                                       |
| `implementation/evidence/S005_REPORT.md` | This appended correction evidence.                                                                                                                                                                                                                                      |

`package.json`, `tsconfig.json`, `tsconfig.unit.json`, `pnpm-lock.yaml`,
`pnpm-workspace.yaml`, `src/cli/main.ts`, the CLI smoke and the contract
validator are unchanged by this correction. No dependency, engine, package
manager, workspace or lockfile change was made.

### R1 — canonical package-owned selection boundaries

- `assertTestRootsReal` rejects a symlinked `tests` or `tests/unit` root using
  final-component `lstat`, so a package checkout reached through an otherwise
  valid working-directory symlink is still accepted (regression: “a package
  checkout reached through a working-directory symlink stays valid”).
- `resolveOperand` rejects absolute operands, any `..` path component, a final
  symlink, or a symlinked ancestor directory before cleanup, compilation or
  execution. A `..legal.test.ts` name is a filename, not traversal.
- Discovery still ignores nested symlink entries without following them
  (regression asserts only the real file is selected and the linked test never
  runs).
- `cleanOwnedOutput` uses `lstatSync` and treats only `ENOENT` as absent, so a
  dangling `.unit-test-build` symlink is rejected before the compiler is
  invoked (regressions: dangling link, live link with an untouched sentinel).
- Invalid selections return before cleanup, so stale owned output and
  side-effect sentinels are preserved (regression: “an invalid selection
  preserves stale output and side-effect sentinels”).

### R2 — discovery and compilation agree

- Discovery remains the full set of regular `*.test.ts` entries, including
  dot-prefixed files/directories and names beginning with `..`.
- Before compiling, the runner writes `tsconfig.unit.generated.json` inside the
  guarded, ignored `.unit-test-build/` tree. It extends `tsconfig.unit.json`
  (preserving inherited strictness and the ordinary `src`/`tests` includes) and
  explicitly lists every discovered entry. No tracked configuration is mutated.
- Explicit selection controls execution only: every discovered entry is still
  compiled, so a TypeScript error in an unselected sibling still fails the run
  (regression: “explicit selection still compiles ordinary inputs it does not
  run”).
- Default and explicit runs both execute valid dot-prefixed and `..`-prefixed
  tests successfully (regression: “dot-prefixed and dotdot-prefixed names run in
  both modes”).

### R3 — event attribution, failures and diagnostics

- Child events are attributed with `entryFile ?? file`, so a failure defined in
  an imported helper is charged to the selected entry file; the defining file
  and line are rendered separately (mapped back to `.ts` source).
- `test:fail` details render the failing test name, its structured
  error/cause (including assertion message, `actual`/`expected`, and location)
  and any captured child stderr, preserving load-error output.
- Every `test:fail` event is fatal, including TODO-marked ones, inline or
  imported (regression: “TODO-marked failures are fatal inline and when
  imported”). Non-failing TODO/skipped tests may coexist with a real passing
  test but cannot satisfy the executed-passing-test requirement.
- An unsuccessful aggregate summary, nonzero aggregate failed/cancelled counts,
  and failure events that cannot be assigned to a selected file all fail the
  run. The existing empty-selection and per-file completion guards are
  preserved (and the missing-summary note is still emitted alongside an
  attributed failure event, e.g. an abnormal child exit).

### Correction verification

All mutating commands ran after successful environment diagnostics from this
package root, routed through the required execution wrapper. Exits are real
process exits. Logs are kept under the gitignored
`implementation/evidence/logs/` directory (not committed).

| Command                                                                     | Exit | Result                                               |
| --------------------------------------------------------------------------- | ---- | ---------------------------------------------------- |
| `pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict` | 0    | `Already up to date`; lock/workspace bytes unchanged |
| `pnpm run typecheck`                                                        | 0    | Both configurations clean                            |
| `pnpm run build`                                                            | 0    | `dist/cli/main.js`                                   |
| `pnpm run test:unit`                                                        | 0    | 1 file; `tests 5`, `pass 5`, `fail 0`                |
| `pnpm run test:unit -- tests/unit/cli-bootstrap.test.ts`                    | 0    | Same 1 file, 5/5 pass                                |
| `pnpm run test:harness`                                                     | 0    | `tests 29`, `pass 29`, `fail 0`                      |
| `pnpm run test:cli-bootstrap`                                               | 0    | `tests 41`, `pass 41`, `fail 0`                      |
| `pnpm run check:contracts`                                                  | 0    | `0 error(s), 0 warning(s)`                           |
| `pnpm run test:contracts`                                                   | 0    | `tests 84`, `pass 84`, `fail 0`                      |
| `pnpm run format:check`                                                     | 0    | All matched files use Prettier code style            |
| `git diff --check` / `git diff --cached --check`                            | 0    | No diagnostics; nothing staged                       |

The harness suite grew from 13 to 29 focused regressions. Every negative
fixture is disposable, lives outside the real `tests/unit` tree, is bounded by a
subprocess timeout, and is removed by test cleanup.

After Prettier reformatted the runner, its regression suite and these guidance
documents, every target lane above was re-run and stayed green with the same
counts (typecheck and build clean, default/explicit unit 5/5, harness 29/29, CLI
smoke 41/41, contract validation 0 errors, contracts 84/84). Two overlapping
concurrent `pnpm run test:contracts` processes each exited 0 with `tests 84`,
`pass 84` and no failures, confirming the fixture-isolation correction is still
intact; fixture-ownership code was not modified by this correction.

### Reference evidence provenance

The reference workspace was verified clean at
`a10fbf06334f4648f5755e05a7147414e4e5fc98` before and after this correction
(Rust source untouched). This same-checkpoint, runner-only correction reuses the
audited fresh S005 reference guard (fmt/check/test exit 0, 562 top-level plus 16
nested subprocess passes, zero failures, four ignored); no fresh Pi Rust run is
claimed. Repetition remains required if the reference identity, Rust scope or
that evidence is invalidated. S006 does not inherit this exception.

### Exceptions and failed attempts

The first corrected `pnpm run test:harness` attempt exited 1 with two assertion
mismatches: an over-narrow expectation that the defining file be rendered as the
`.ts` source (the child reports the compiled `.js`) and an over-strict expected
reason for the abnormal-exit case. Both were corrected by mapping mirrored
compiled paths back to source and by keeping the attributed failure event while
still noting the missing per-file summary; the rerun passed 29/29. Earlier
candidate exceptions and formatting retries above remain historical. The first
correction format check also failed for four changed files; a scoped formatting
write and subsequent checks passed. This failed attempt is preserved in the
author's correction logs and is not counted as a passing gate.

### Correction self-review

`package.json`, both tracked tsconfig files, the lockfile, the workspace
manifest, `src/cli/main.ts`, the CLI smoke and the contract validator are
byte-unchanged. The generated compiler configuration is written only inside the
gitignored owned output tree and never mutates tracked configuration. The runner
still fails closed on empty selection, missing per-file summaries, skipped/TODO
-only files and compile failure, and no new timeout or filter API was added.
S005 remains `in_progress`; S006 is untouched.
