# S004 step report — Create a minimal typed CLI build boundary

Codex review 2, 2026-09-29: **accepted and complete**, S004 commit
`fd5d5162c7e5e3fa22fcc8a0365525f4e0e6a100`. All S004-R1–R3 findings are closed; independent
smoke 41/41, contracts 83/83 and earlier failing probes pass. See
`S004_REVIEW.md`. The original submission and correction-pass observations below
are historical. S005 is authorized by the governing dispatch. Codex recorded
the real hash after committing without amending history; this factual update
travels with S005.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S004","kind":"report","commit":"fd5d5162c7e5e3fa22fcc8a0365525f4e0e6a100","disposition":"implemented"}
-->

Step ID and title: S004 — Create a minimal typed CLI build boundary.
Contract/requirement IDs: R01, R02, R30, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see
`implementation/evidence/S004_REPORT.md` disposition below and `specs/`).
Actual target root and branch: this repository (`.`) on branch `master`.
Starting commit / baseline status:
`91cdaaefd756021b343465f7ba7dd3afe2f71b6d` (`master`, S003 complete). The
working tree already held the four expected unstaged Codex post-commit
bookkeeping files (`implementation/COMMIT_SEQUENCE.md`,
`implementation/COMMIT_SEQUENCE.json`, `implementation/evidence/S003_REPORT.md`,
`implementation/evidence/S003_REVIEW.md`); they were preserved unchanged.

Author/provider: Pi, provider `ollama`, model `deepseek-v4.1-flash:cloud`.
Runtime used for target tooling: process-local Node `24.21.0` with
`pnpm 11.22.0`, using the required execution routing after successful
environment diagnostics. No global tool or
package-manager configuration was changed.

## Implemented

Exact behavior added or changed: S004 establishes a typed executable boundary.
A minimal CLI entrypoint is compiled by the pinned TypeScript compiler under the
dispatched strict NodeNext/ES2023 configuration; `package.json` gains the
development version, the `svelte-ui-kit` bin mapping and real `build`,
`typecheck` and `test:cli-bootstrap` scripts; and a dependency-free executable
smoke suite exercises the bootstrap. No product command, project discovery,
network access, filesystem write, consumer runtime facade or registry asset was
added, and no dependency, lockfile, engine, package-manager or workspace value
changed.

Files changed or added and purpose:

| Path                                       | Change                                                                                                                                                                             |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/cli/main.ts`                          | New. Shebang entrypoint; reads/validates `name`/`version` from this package's `package.json` relative to the built module; implements only help/version and honest stderr rejects. |
| `tsconfig.json`                            | New. Dispatched strict config: ES2023 target/lib, NodeNext module/resolution, `types: ["node"]`, `strict`, `noEmitOnError`, `rootDir: src`, `outDir: dist`; no `skipLibCheck`.     |
| `tests/smoke/cli-bootstrap.test.mjs`       | New. Dependency-free `node:test` executable smoke.                                                                                                                                 |
| `package.json`                             | Adds `version: 0.1.0`, the `bin` mapping and the three scripts. All S003 dependencies, existing scripts and metadata are preserved.                                                |
| `README.md`                                | Aligns status and the real setup/verification commands.                                                                                                                            |
| `CONTRIBUTING.md`                          | Removes the stale "no build or test suite" claim; documents the pinned setup, contract tests and CLI bootstrap.                                                                    |
| `implementation/evidence/COMPATIBILITY.md` | Adds a bounded S004 build-boundary addendum; no consumer/SSR/browser/packaging claim.                                                                                              |
| `implementation/evidence/S004_REPORT.md`   | This candidate report.                                                                                                                                                             |

Unchanged as required: `pnpm-lock.yaml` (byte-identical to the accepted S003
post-frozen state; SHA-256 `81b9ba06e6fc68932d6cdc83fb33c175f139828c62d36b9cf9bedeaab54a3dff`),
`pnpm-workspace.yaml` (`226909e7…`), `.node-version`, all nine exact
`devDependencies`, `private: true`, ESM, license, `packageManager:
pnpm@11.22.0`, `engines.node: ">=24"`, the four existing scripts and the
repository/URL metadata. `dist/` build output is gitignored and uncommitted.

### Bootstrap contract as implemented

- No arguments, sole `--help` or sole `-h`: help on stdout, empty stderr, exit 0.
- Sole `--version` or sole `-V`: `<metadata name> <metadata version>` plus a
  final newline on stdout, empty stderr, exit 0. With the pinned metadata this
  is `svelte-ui-kit 0.1.0`.
- Every other argument list (mixed/repeated help/version flags, unknown flags
  such as `--json`/`--cwd`, and future product command names): useful human
  diagnostic on stderr, empty stdout, exit 2.
- Metadata is read relative to the built module (`import.meta.url`), never from
  cwd, Git or the invoking application. A missing, unreadable, unparseable or
  semantically invalid metadata file fails clearly on stderr with exit 1.

`--version` derives its text from validated metadata; no version literal is
duplicated in `src/cli/main.ts`.

## Verified

Executed mutating dependency/build/test commands ran under process-local Node
`24.21.0` and pnpm `11.22.0` after successful environment diagnostics, using
the required routing. One initial unrouted format attempt was blocked before
execution and then retried correctly. Working directory for target commands was
this package root. Exits are real process exits (`PIPESTATUS[0]`), not
trailing-pipeline results. Per-attempt logs are kept under the gitignored
`implementation/evidence/logs/` directory and are not committed.

| Step | Command                                                                     | Exit | Result                                                             |
| ---- | --------------------------------------------------------------------------- | ---- | ------------------------------------------------------------------ |
| 0    | Required environment diagnostics                                            | 0    | Green for this task; unrelated advisory recorded in author session |
| 1    | `pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict` | 0    | `Already up to date`; lock and workspace bytes unchanged           |
| 2    | `pnpm run typecheck`                                                        | 0    | No diagnostics                                                     |
| 3    | `pnpm run build`                                                            | 0    | Emits only `dist/cli/main.js`, shebang preserved                   |
| 4    | `pnpm run test:cli-bootstrap`                                               | 0    | `tests 27`, `pass 27`, `fail 0`, `skipped 0`                       |
| 5    | `pnpm run check:contracts`                                                  | 0    | `contract validation: 0 error(s), 0 warning(s)`                    |
| 6    | `pnpm run test:contracts`                                                   | 0    | `tests 83`, `pass 83`, `fail 0`, `skipped 0` (sequential)          |
| 7    | `pnpm run format:check`                                                     | 0    | All matched files use Prettier code style                          |
| 8    | `git diff --check` / `git diff --cached --check`                            | 0    | No whitespace diagnostics; nothing staged                          |

Log locations (gitignored): `implementation/evidence/logs/s004-typecheck-1.log`,
`s004-build-1.log`, `s004-cli-bootstrap-1.log` (failed first attempt),
`s004-cli-bootstrap-2.log`, `s004-typecheck-negative-1.log`,
`s004-typecheck-2.log`, `s004-format-1.log`, `s004-install-frozen-1.log`,
`s004-contracts-check-1.log`, `s004-contracts-test-1.log`,
`s004-reference-check-1.log`, `s004-reference-test-1.log`.

### Executable smoke evidence

`tests/smoke/cli-bootstrap.test.mjs` resolves the entrypoint from the
`package.json` `bin` mapping, fails rather than skips when the built output is
absent, and runs the CLI with the active Node. 27/27 pass:

- Built entrypoint existence (missing output fails the suite).
- No-argument, `--help` and `-h` help: exit 0, empty stderr, stdout contains
  `Usage:`, `--help`, `--version` and a bootstrap note.
- `--version` and `-V`: exit 0, empty stderr, stdout exactly `svelte-ui-kit 0.1.0\n`.
- 16 rejected argument lists (`--help --version`, `-V -h`, `--version --version`,
  `--help extra`, `--json`, `--cwd .`, `--json --version`, `add`, `init`,
  `view button`, `--`, an empty string, `-v`, `--Version`, and symmetric
  variants): exit 2, empty stdout, `svelte-ui-kit:`/`Usage:` on stderr.
- Unrelated cwd with spaces plus a decoy `package.json` (`decoy-app` `9.9.9`)
  and a hidden fixture file: help/version still print the real metadata, and a
  recursive snapshot (including hidden entries) is unchanged afterwards.
- Disposable copy containing only `dist/` and `package.json` (no `node_modules`):
  help/version succeed and the copy is not written to.
- Structurally valid JSON with missing/invalid `name`/`version`, and completely
  missing metadata: exit 1, empty stdout, `svelte-ui-kit:` stderr diagnostic.
- Syntactically invalid JSON: exit 1 with Node's own clear stderr rejection
  (see Exceptions).

### Negative-typecheck evidence

A temporary fixture `src/cli/__s004_negative_typecheck.ts`
(`export const negativeTypecheckFixture: number = "not a number";`) was added,
then removed without commit:

- With the fixture: `pnpm run typecheck` exited `2` and reported
  `src/cli/__s004_negative_typecheck.ts(2,14): error TS2322: Type 'string' is not assignable to type 'number'.`
  (`implementation/evidence/logs/s004-typecheck-negative-1.log`).
- After restoring (fixture deleted): `pnpm run typecheck` exited `0`
  (`implementation/evidence/logs/s004-typecheck-2.log`).

This proves the typecheck lane is real, not placeholder-green, and that strict
errors are not suppressed.

### Self-review and staged-diff findings

- `package.json` diff is exactly the added `version`, `bin` and three scripts;
  every other key is byte-identical, and the lockfile/workspace are unchanged.
- `tsconfig.json` matches the dispatch exactly; there is no `skipLibCheck`,
  `any` or `@ts-*` suppression, and no relative import needs a `.js` specifier
  beyond the single `node:fs` builtin import.
- Built output re-reads metadata via `import.meta.url`, so a decoy cwd metadata
  file cannot influence output; the smoke suite proves this.
- The entrypoint has no `export` and imports only `node:fs`; it exposes no
  consumer Svelte/registry/runtime surface.
- Codex's four bookkeeping files remain modified but were not edited by this
  step; the S003 accepted hashes/dispositions are intact.

## Exceptions

Failures and retries:

- An initial unrouted format invocation was blocked by command enforcement;
  it did not execute or pass. The correctly routed invocation later passed.
- Formatting the new report initially failed (`s004-format-2.log`); scoped
  formatting (`s004-format-write-1.log`) and the final check
  (`s004-format-3.log`) passed. These attempts were disclosed in Pi's return
  and are now reconciled into this report by Codex.
- First smoke attempt (`s004-cli-bootstrap-1.log`) failed 1/27: the malformed
  metadata case wrote syntactically invalid JSON into the disposable copy.
  Node resolves the nearest `package.json` to decide module type before
  executing the entrypoint, so the module never ran and the diagnostic was
  Node's `ERR_INVALID_PACKAGE_CONFIG` (exit 1, clear stderr) rather than the
  CLI's own message. The test was corrected to (a) exercise the CLI's own
  validation with structurally valid JSON that has missing/invalid `name`/
  `version`, and (b) assert Node's own clear exit-1 rejection for unparseable
  JSON. The corrected run passed 27/27 (`s004-cli-bootstrap-2.log`). This is a
  test-precision correction; the CLI's observable contract (exit 1 + clear
  stderr for missing/malformed metadata) still holds.
- Node's early rejection message for unparseable metadata includes the
  disposable copy's absolute temp path. That is transient runtime program
  output, not repository content.

Skipped checks: none. Contract suites/rehearsals were run sequentially; the
known shared-temp assertion correction remains assigned to S005 and was not
modified or waived.

Unverified behavior and release impact: consumer scaffolding, rendering,
SSR/hydration, browser tests, lint, `svelte-check`, and package/tarball
acceptance do not exist and are not claimed. The command envelope/exit map and
argument grammar are not frozen by this bootstrap (S022–S023). No human release
test is due.

Deviations with record ID and repository evidence: none. All S004 choices were
pre-approved by the dispatch and resolved without substitution or weakened
checks.

Unresolved issues after Codex review: S004-R1–R3 in the governing correction
dispatch. S004 is not accepted. The S005 test-isolation follow-up is unchanged
and intentionally not addressed here.

### Conditional reference guard

Verified clean reference worktree at
`a10fbf06334f4648f5755e05a7147414e4e5fc98` before and after the guard; no
reference source was changed. Commands were run from the reference workspace
root using the required execution routing.

| Step | Command                                 | Exit | Result                                                                  |
| ---- | --------------------------------------- | ---- | ----------------------------------------------------------------------- |
| R1   | `cargo fmt --all -- --check`            | 0    | No diffs                                                                |
| R2   | `cargo check --workspace --all-targets` | 0    | `Finished dev profile`                                                  |
| R3   | `cargo test --workspace --all-targets`  | 0    | 562 top-level passes + 16 nested subprocess passes; 0 failed; 4 ignored |

The aggregate is 578 passed (562 top-level + 16 nested subprocess executions),
0 failed, 4 ignored. The four ignored tests are
`installed_binaries_run_after_package_source_and_build_state_are_deleted`,
`homepage_fixture_cli_workflow_smoke`,
`tests::every_transaction_io_fault_avoids_partial_application_state`, and
`packaged_sources_build_with_cargo_vcs_provenance_outside_and_inside_hostile_git`.
They remain ignored and are not claimed as executed.
`implementation/evidence/logs/s004-reference-check-1.log` and
`s004-reference-test-1.log` hold the raw output.

## Commit and next action

Actual commit hash: pending; this report is candidate evidence with a null
commit. Authorized message: `cli: establish the typed executable boundary`.

Structured `checkpoint-evidence` record: report `candidate`, null commit (above);
no review is authored by Pi and no acceptance is claimed.

Requirements/test evidence updated: this report, the
`implementation/evidence/COMPATIBILITY.md` addendum, the CLI bootstrap smoke and
the aligned README/CONTRIBUTING. The governing ledger and JSON projection are
unchanged by this step (S004 remains `in_progress`, projection validates
read-only).

Next step ID: S005 — Add a real unit-test harness. It remains locked until Codex
independently reviews and accepts S004 and commits it.

Is the next step safe to begin? No. S004 is returned unstaged/uncommitted with
S004 `in_progress`; S005 and all successors remain locked.

### Decisions requiring Codex

None blocking. One behavior worth Codex's awareness: Node's package-config
resolution rejects syntactically invalid `package.json` before the entrypoint
runs, so the CLI cannot emit its own diagnostic in that sub-case; observable
behavior is still a clear stderr failure with exit 1. The implemented CLI fails
its own metadata checks (missing file, non-object, missing/invalid
`name`/`version`) with exit 1. No substitution, dependency change or scope
change was made.

---

## Codex review 1 correction pass — implementation results

Appended by Pi. This section records the S004-R1–R3 correction work and its
actual results. It preserves Codex's earlier corrections, review disposition
and all prior failure history above. S004 remains `in_progress`; this report
remains `candidate` with a null commit, and the review remains
`changes_requested` with a null commit. No acceptance is claimed.

Baseline/current HEAD at the start and end of this pass:
`91cdaaefd756021b343465f7ba7dd3afe2f71b6d` (`master`). All existing candidate
work and all four Codex post-S003 bookkeeping files were preserved unchanged.

### S004-R1 — Complete metadata validation

`src/cli/main.ts` now requires the exact product identity and full SemVer:

- `EXPECTED_NAME = "svelte-ui-kit"` compared with strict equality, so a
  different name, a whitespace-normalized alias and any name containing a
  control character, space, tab or newline are rejected.
- The version is checked against the full [SemVer 2.0.0](https://semver.org)
  grammar, including optional prerelease and build metadata. Numeric prerelease
  identifiers must not carry a leading zero; build identifiers may. The check is
  inline (a single anchored regular expression); no dependency was added.
- Metadata must be a JSON object (arrays and other non-object JSON are
  rejected). Diagnostics are fixed strings and never echo untrusted metadata
  text; every rejection is exit 1 with empty stdout.
- Validation runs before argument dispatch, so a broken installation exits 1 for
  `--help`, `--version` and every other invocation; valid metadata with an
  unsupported argument list still exits 2. A dedicated executable case runs a
  broken-metadata copy with no arguments, `--help`, `-h`, `--version`, `-V`,
  `add` and `--json`, confirming exit 1 and empty stdout for every one.

Executable cases added to `tests/smoke/cli-bootstrap.test.mjs` (all pass):

| Group                                                      | Cases | Result                                      |
| ---------------------------------------------------------- | ----- | ------------------------------------------- |
| Wrong/control/whitespace names                             | 10    | exit 1, empty stdout, CLI stderr diagnostic |
| Non-string `name` (Node package-config rejection)          | 5     | exit 1, empty stdout, safe stderr           |
| Missing `name`, missing/non-string `version`               | 7     | exit 1, empty stdout, CLI stderr diagnostic |
| Non-object metadata (array/null/string/number/boolean)     | 6     | exit 1, empty stdout, safe stderr           |
| Invalid versions (empty identifiers, leading zeroes, etc.) | 23    | exit 1, empty stdout, CLI stderr diagnostic |
| Valid versions printed verbatim                            | 15    | exit 0, `svelte-ui-kit <version>` + newline |

The 15 preserved valid versions include `2.3.4-rc.1+build.001`, `1.2.3-0` and
`1.2.3+001`, confirming build identifiers with leading zeroes are not wrongly
prohibited. The 23 invalid versions include `1.2.3-01`, `1.2.3-1.01`,
`1.2.3-..`, `1.2.3+..`, empty identifiers and leading/trailing
whitespace/newline cases.

Observed Node behavior worth recording (no product defect): while selecting the
module loader, Node validates the package `name` field type and also rejects a
non-object or unparseable `package.json` with `ERR_INVALID_PACKAGE_CONFIG`
before the entrypoint runs. Those cases therefore show Node's own clear stderr
and exit 1 rather than the CLI's message; the observable contract (exit 1,
empty stdout, safe diagnostic) holds, matching the acceptance Codex already
recorded for syntactically invalid JSON. The CLI's own non-object and
non-string-`name` branches remain as defense in depth but are not reachable
through this package's own metadata path. No wrapper was added.

### S004-R2 — Falsifiable smoke claims

`tests/smoke/cli-bootstrap.test.mjs` now uses a deterministic `snapshot` helper
that records, sorted and including hidden entries: each entry's relative path
and `lstat` type, a regular file's byte length plus SHA-256, and a symlink's raw
target without following the link. No timestamps are recorded, so read-induced
atime/mtime changes cannot influence the result. Name-only comparison is gone.

Coverage added (all pass):

- Five supported help/version invocations and seven rejected argument lists run against an
  owned seeded fixture containing a visible file, a hidden file, a nested
  directory with hidden and visible entries, and file/directory symlinks; the
  full content snapshot is unchanged after every invocation.
- An unrelated cwd with spaces that also contains a decoy `package.json`; help
  and version still print the real metadata and the fixture is not written to.
- A disposable copy with only `dist/` and `package.json` (no `node_modules`):
  help/version succeed and the strengthened snapshot is unchanged.
- A disposable copy whose valid package version is changed to
  `2.3.4-rc.1+build.001`: both `--version` and `-V` print the changed value
  from an unrelated cwd, proving the version is metadata-derived.
- Focused snapshot regressions: a same-path, same-length byte replacement is
  detected, and a retargeted symlink is detected.

Two disposable-copy mutation probes keep the claims falsifiable. Each copies
only built output, package metadata and this smoke file, injects the mutation
into the copied `dist/cli/main.js` (never the actual source), runs the copied
suite, and asserts it fails:

| Mutant                                                                                  | Nested exit | Failing tests                                                                                                                              |
| --------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Existing-file-write (overwrite a pre-existing seeded hidden file)                       | 1           | `help, version and rejected argument lists never write to a seeded cwd`; `runs from an unrelated cwd with spaces and ignores cwd metadata` |
| Hard-coded version (literal `svelte-ui-kit 0.1.0`, copy version `2.3.4-rc.1+build.001`) | 1           | both version-output forms, the unrelated-cwd, disposable-copy and changed-version tests, and the valid-version matrix                      |

All mutation fixtures are created under owned temporary directories and removed
by test cleanup; the real implementation source and real `dist/` are never
mutated for these probes. The nested run sets `SVELTE_UI_KIT_MUTATION_PROBE=1`
so its own mutation meta-tests are skipped instead of recursing, and the probe
removes the outer runner's inherited `NODE_TEST_CONTEXT` variable; without that
removal the nested `node --test` silently no-ops and returns 0.

### S004-R3 — Evidence reconciliation

- Codex's public-report corrections, review disposition and the compatibility
  addendum's unchanged-dependency-versus-new-package-version distinction are
  preserved. `implementation/evidence/S004_REVIEW.md` was not edited.
- The strengthened suite supersedes the earlier 27-test count for these claims;
  the historical 27/27 observation above describes the pre-correction
  submission.
- Failure history is preserved and extended: the initial blocked unrouted
  formatting invocation, the later report formatting failure and the first
  smoke attempt remain recorded above, and this pass adds a new formatting
  failure (`format:check` exited 1 for `src/cli/main.ts` and
  `tests/smoke/cli-bootstrap.test.mjs`), a scoped formatting write and a green
  re-check, plus the mutation-probe harness retries below.
- Ordinary suite passes are reported separately from negative/mutation
  evidence. Logs, generated output and operator paths stay out of this
  committed document.

### Correction-pass verification (final, post-formatting)

Run with process-local Node `24.21.0` and pnpm `11.22.0` using the required
execution routing, from this package root. Exits are real process exits. Each
attempt has its own log under the gitignored `implementation/evidence/logs/`.

| Step                  | Command                                                                     | Exit | Result                                               |
| --------------------- | --------------------------------------------------------------------------- | ---- | ---------------------------------------------------- |
| Frozen strict install | `pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict` | 0    | `Already up to date`; lock/workspace bytes unchanged |
| Typecheck             | `pnpm run typecheck`                                                        | 0    | No diagnostics                                       |
| Build                 | `pnpm run build`                                                            | 0    | `dist/cli/main.js`, shebang preserved                |
| Strengthened smoke    | `pnpm run test:cli-bootstrap`                                               | 0    | `tests 41`, `pass 41`, `fail 0`, `skipped 0`         |
| Contract validation   | `pnpm run check:contracts`                                                  | 0    | `0 error(s), 0 warning(s)`                           |
| Contract tests        | `pnpm run test:contracts`                                                   | 0    | `tests 83`, `pass 83`, `fail 0`, sequential          |
| Format check          | `pnpm run format:check`                                                     | 0    | All matched files use Prettier code style            |
| Git whitespace        | `git diff --check` / `git diff --cached --check`                            | 0    | No diagnostics; nothing staged                       |

Final authoritative logs (gitignored):
`implementation/evidence/logs/s004-corr-final-typecheck-2.log`,
`s004-corr-final-build-2.log`, `s004-corr-final-cli-bootstrap-2.log`,
`s004-corr-final-contracts-check-3.log`, `s004-corr-final-contracts-test-3.log`,
`s004-corr-format-check-7.log`, plus `s004-corr-install-frozen.log`. Every
failed or superseded attempt keeps its own log: the pre-format passes
(`s004-corr-{typecheck,build,cli-bootstrap,contracts-check,contracts-test}.log`),
the first post-format passes (`s004-corr-final-*.log`), and the formatting
failures/retries `s004-corr-format-check.log` (exit 1),
`s004-corr-format-write.log`, `s004-corr-format-check-2.log`,
`s004-corr-format-check-3.log` (exit 1, this report),
`s004-corr-format-write-2.log`, `s004-corr-format-check-4.log`,
`s004-corr-format-check-5.log`, `s004-corr-format-check-6.log` (exit 1, the
strengthened smoke file), `s004-corr-format-write-3.log` and
`s004-corr-format-check-7.log`.

Negative/mutation evidence is deliberately separate from the ordinary passes:
the two disposable-copy mutant suites above are the only negative suites, and
they are asserted to fail (exit 1) inside the parent smoke run.

### Reference guard — reused, not freshly executed

Reference identity re-verified unchanged and clean at
`a10fbf06334f4648f5755e05a7147414e4e5fc98` (no reference source modified). This
correction changes only TypeScript source, tests and evidence documents, with no
Rust or reference scope change, so Codex's audited fresh S004 reference guard is
cited as **reused**: `cargo fmt --all -- --check`, `cargo check --workspace
--all-targets` and `cargo test --workspace --all-targets` all exit 0 with 562
top-level plus 16 nested subprocess passes, zero failures and four ignored slow
lanes. No fresh Pi Rust run is claimed; a rerun is required only if the
reference/Rust scope changes or that evidence is invalidated.

### Correction-pass failures and retries

- `format:check` exited 1 on the freshly written `src/cli/main.ts` and
  `tests/smoke/cli-bootstrap.test.mjs`; a scoped `prettier --write` was then run
  and `format:check` exited 0. The failed attempt is preserved. Further
  formatting failures occurred after this report's correction section was
  appended (`format:check` exit 1 for `implementation/evidence/S004_REPORT.md`)
  and after the metadata-precedes-arguments case was added (`format:check` exit
  1 for `tests/smoke/cli-bootstrap.test.mjs`); scoped writes and re-checks
  restored green each time.
- The first strengthened-smoke iteration asserted a CLI stderr diagnostic for
  non-object metadata and non-string `name`. Node rejects both while selecting
  the module loader, so those expectations were corrected to assert the same
  observable contract with Node's safe diagnostic; the product behavior was not
  changed.
- The first mutation-probe iteration copied a minimal manifest without the `bin`
  mapping, so the copied suite crashed at load instead of exercising the
  mutant, and it inherited `NODE_TEST_CONTEXT`, so the nested runner no-opped and
  returned 0. Both were fixed by carrying the real manifest forward and clearing
  the inherited runner variable; the mutants then failed for their intended
  assertions.

### Correction-pass self-review and limitations

- `package.json` still adds only `version`, the `bin` mapping and the three
  scripts; `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.node-version`, the engine,
  package manager, all nine dependency pins and the four pre-existing scripts
  are byte-unchanged.
- No dependency, lockfile, runtime-pin or workspace change; no wrapper; no
  consumer export facade, Svelte import or registry asset.
- The strengthened smoke remains the S004 bootstrap lane only; the S005 unit
  harness and its shared-temp correction are untouched. Contract suites ran
  sequentially.
- Still not proven here: consumer scaffolding, rendering, SSR/hydration,
  browser, lint, `svelte-check`, and package/tarball acceptance. The bootstrap
  argument grammar and exit map are not frozen (S022–S023). No human release
  test is due.

### Correction-pass decisions requiring Codex

One consequence is reported for Codex's scope judgement; it does not block the
remaining work. Node's package-config loader validates the `name` field type and
rejects a non-object or unparseable `package.json` before the entrypoint runs,
so R1's non-object/non-string-`name` cases are enforced by Node rather than by
the CLI's own diagnostic. The observable contract (exit 1, empty stdout, safe
stderr) holds in every case, matching Codex's recorded acceptance for
unparseable JSON. Bounded alternatives if Codex prefers the CLI's own message
there: (a) accept the current behavior as satisfying R1 (no change), or
(b) authorize a metadata-resolution change so the entrypoint can read a
malformed file without Node's pre-module validation. Option (b) would deviate
from the dispatch's no-wrapper/architecture rule, so no change was made.
