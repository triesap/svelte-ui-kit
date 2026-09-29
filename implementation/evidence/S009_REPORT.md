# S009 step report — Add isolated filesystem and CLI integration helpers

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S009","kind":"report","commit":null,"disposition":"candidate"}
-->

Step ID and title: S009 — Add isolated filesystem and CLI integration helpers.

Contract/requirement IDs: R15, R16, R29, R30, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/ACCEPTANCE_CRITERIA.md`,
`specs/API_CONTRACTS.md`, `specs/SECURITY_AND_TRANSACTIONS.md`,
`specs/SYNCHRONIZATION.md`).

Author: Pi, provider `ollama`, model `deepseek-v4.1-flash:cloud`. Runtime:
process-local Node `24.21.0` / `pnpm 11.22.0`, after `cargo extbuild doctor`
(exit 0), with mutating commands routed through `cargo extbuild run --`. No new
dependency was added.

Under the owner-authorized batch this report is a candidate; the S009
implementation commit makes it `committed_pending_review` pending independent
Codex review.

## Dispatch mapping

| #   | Dispatch decision                     | Implementation                                                                                                                                                                                                                                            | Evidence                                                             |
| --- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1   | Typed helpers under `tests/helpers/`  | `project.ts` (owned temp root + escaping-path guard), `tree-snapshot.ts` (lstat/readlink complete-tree snapshot) and `cli.ts` (real built-CLI invocation, bounded, verbatim streams). Typed tests at `tests/integration/harness.test.ts`.                 | Those files; 9 passing integration tests                             |
| 2   | Suite selector in the typed runner    | `--suite unit                                                                                                                                                                                                                                             | integration                                                          | components`(default`unit`); `unit`keeps S005 behavior;`integration`uses`tests/integration`and`tsconfig.integration.json`. Root `test:integration` builds first. | `tools/run-unit-tests.mjs`, `tsconfig.integration.json`, `package.json` |
| 3   | Isolated suite config and output      | Each suite compiles into `.unit-test-build/<suite>/` via an ephemeral config extending the tracked `tsconfig.<suite>.json`; each run removes only its own suite output; symlinked/non-directory ancestor or suite output roots are refused.               | `tools/run-unit-tests.mjs`; harness "suite output directories" tests |
| 4   | Preserve protections and extend tests | S005 discovery, containment, symlink, stale-output, per-file-summary, TODO-cancellation and abnormal-exit protections retained; harness grew 29 → 35 with new suite-selection/isolation tests.                                                            | `tools/run-unit-tests.test.mjs`; 35/35 harness                       |
| 5   | Snapshot, cleanup and CLI proof       | Snapshot preserves bytes/modes/kinds/hidden/dirs/link targets without following links; cleanup on setup/assertion failure leaves external sentinels and symlink targets unchanged; CLI exit/stdout/stderr, spaced cwd and bounded process failure tested. | `tests/integration/harness.test.ts`; 9/9 integration                 |

## Files changed or added

| Path                                                                                                         | Change   | Purpose                                                               |
| ------------------------------------------------------------------------------------------------------------ | -------- | --------------------------------------------------------------------- |
| `tools/run-unit-tests.mjs`                                                                                   | modified | Suite selector, per-suite config/output, suite-scoped cleanup.        |
| `tools/run-unit-tests.test.mjs`                                                                              | modified | Path updates plus six new suite-selector regression tests.            |
| `tests/helpers/project.ts`                                                                                   | new      | Owned temp project with escaping-path guard.                          |
| `tests/helpers/tree-snapshot.ts`                                                                             | new      | Complete-tree snapshot without following links.                       |
| `tests/helpers/cli.ts`                                                                                       | new      | Real bounded built-CLI invocation helper.                             |
| `tests/integration/harness.test.ts`                                                                          | new      | Nine typed integration tests.                                         |
| `tsconfig.integration.json`                                                                                  | new      | Integration suite compiler configuration.                             |
| `tsconfig.unit.json`                                                                                         | modified | Unit output moved to `.unit-test-build/unit`.                         |
| `package.json`                                                                                               | modified | Adds `test:integration`; `typecheck` includes the integration config. |
| `README.md`, `CONTRIBUTING.md`, `implementation/VERIFICATION.md`, `implementation/evidence/COMPATIBILITY.md` | modified | Document the suite selector and integration lane.                     |
| `implementation/COMMIT_SEQUENCE.md`                                                                          | modified | S008 recorded pending review; S009 active.                            |

## Verification

All commands ran from the package root under Node `24.21.0`/`pnpm 11.22.0`,
routed through `cargo extbuild run --`. Logs are under
`implementation/evidence/logs/` (`s009-*.log`).

| Step                     | Command                                                          | Exit | Result                                    | Log                            |
| ------------------------ | ---------------------------------------------------------------- | ---- | ----------------------------------------- | ------------------------------ |
| Both compiler typechecks | `pnpm run typecheck`                                             | 0    | includes `tsconfig.integration.json`      | `s009-typecheck-pre.log`       |
| Scoped integration lane  | `pnpm run test:integration -- tests/integration/harness.test.ts` | 0    | 1 file; 9 tests, 9 pass                   | `s009-integration.log`         |
| Default integration lane | `pnpm run test:integration`                                      | 0    | 1 file; 9 tests, 9 pass                   | `s009-integration-default.log` |
| Unit suite               | `pnpm run test:unit`                                             | 0    | 2 files; 14 tests, 14 pass                | `s009-unit.log`                |
| Runner harness           | `pnpm run test:harness`                                          | 0    | 35 tests, 35 pass                         | `s009-harness.log`             |
| Lint                     | `pnpm run lint`                                                  | 0    | no findings                               | `s009-lint.log`                |
| Format check             | `pnpm run format:check`                                          | 0    | All matched files use Prettier code style | `s009-format-check.log`        |

Earlier in the slice, `pnpm run typecheck` exited 2 on a `Stats` typing issue
in `tree-snapshot.ts`; importing `type Stats` fixed it and the next run exited 0. No assertion was weakened.

## Coverage detail

- The runner harness confirms: explicit integration selection in both
  `--suite integration` and `--suite=integration` forms; a unit run leaves the
  integration output tree intact and vice versa; the integration run removes
  only its own stale output; a unit operand cannot be selected from the
  integration suite; unknown/missing suite names fail closed; integration
  compile failures name the integration configuration; empty discovery is
  suite-specific.
- The integration suite confirms: owned temp projects clean up and never touch
  an unrelated project; escaping/absolute/malformed paths are rejected; the
  snapshot records bytes, modes, kinds, hidden entries, directories and link
  targets without following links and is deterministic; byte and mode changes
  are detected; the real built CLI's version/exit, unsupported-argument
  stderr/exit 2, a spaced working directory, and a bounded non-terminating
  process are all captured; cleanup after a setup/assertion failure leaves
  external sentinels and symlink targets unchanged.

## Limitations

- S009 is test tooling; no production filesystem/transaction boundary, injected
  product interface or registry behavior is introduced.
- Only the macOS/Node 24.21.0 lane was exercised.
- No package/tarball acceptance or release-readiness claim is made.
- Pending review is not independent acceptance.

## Self-review findings

- The default `unit` suite retains its S005 discovery, containment, cleanup,
  compile-before-run and fail-closed result policy; only the owned output path
  moved to an unambiguous suite subdirectory.
- Suite cleanup refuses symlinked `.unit-test-build` ancestors and removes only
  the selected suite's output, so suites cannot destroy each other's state.
- Helpers never import the CLI module, mock its streams or target a user
  project; they spawn the real built executable with a bounded timeout.
- Snapshots use non-following metadata, so link targets are recorded and never
  traversed.

## Commit and next action

Commit message: `test: isolate cli and filesystem integration fixtures`. The
commit hash is recorded in this report's evidence after the commit. Next
checkpoint: S010, authorized to proceed after the S009 green commit. Nothing
was pushed or published and S013 was not started.
