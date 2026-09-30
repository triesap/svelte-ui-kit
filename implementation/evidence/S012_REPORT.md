# S012 step report — Separate orchestration and pure module interfaces

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S012","kind":"report","commit":"14de6da6fbeb58af2a3843874e86c391e4a17051","disposition":"candidate"}
-->

Step ID and title: S012 — Separate orchestration and pure module interfaces.

Contract/requirement IDs: R01, R02, R03, R15, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/ARCHITECTURE.md`,
`specs/COMPONENT_CATALOG.md`, `specs/GENERATED_LAYOUT.md`,
`specs/PRODUCT_SPEC.md`, `specs/SECURITY_AND_TRANSACTIONS.md`,
`specs/SYNCHRONIZATION.md`).

Author: Pi, provider `ollama`, model `deepseek-v4.1-flash:cloud`. Runtime:
Node `24.21.0` / `pnpm 11.22.0`. No new dependency was added.

Under the owner-authorized batch this report is a candidate; the S012
implementation commit makes it `committed_pending_review` pending independent
Codex review. S013 was not started.

## Dispatch mapping

| #   | Dispatch decision                     | Implementation                                                                                                                                                                                | Evidence                                         |
| --- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| 1   | Preserve CLI behavior, extract purity | `parseCliArgs` and pure `HELP_TEXT`/`formatUsageDiagnostic`/`applyRequest`/`runCli` with injected io; `main.ts` keeps metadata read/validation and real stdout/stderr/exit effects.           | `src/cli/*.ts`; CLI smoke 41/41; boundaries test |
| 2   | Minimal readonly `src` interfaces     | `ProjectInput` (`src/project/input.ts`), `RegistrySnapshot`/`RegistryItemRef` (`src/registry/snapshot.ts`), `PlanningOutcome` (`src/codegen/plan.ts`) — type-only.                            | Those files                                      |
| 3   | `tests/unit/boundaries.test.ts`       | Pure import/execution writes nothing; injected result matches the built adapter; `@ts-expect-error` compile-negative boundary values; consumer sources import no CLI/Node/registry internals. | `tests/unit/boundaries.test.ts`; unit 20/20      |
| 4   | Preserve smoke and runner regressions | CLI smoke 41/41, runner harness 35/35, integration 9/9, components 4/4, SSR/lifecycle 17/17, browser 11/11 unchanged in meaning.                                                              | Logs under `implementation/evidence/logs/`       |
| 5   | Full cumulative RCLD-01 suite         | All lanes plus contracts, actionlint and the fresh reference guard executed at this milestone.                                                                                                | `COMPATIBILITY.md` S012; gate table below        |

## Files changed or added

| Path                                       | Change   | Purpose                                                         |
| ------------------------------------------ | -------- | --------------------------------------------------------------- |
| `src/cli/args.ts`                          | new      | Pure argument classification.                                   |
| `src/cli/run.ts`                           | new      | Pure help/usage/version result handling with injected io.       |
| `src/cli/main.ts`                          | modified | Node adapter uses the pure modules; effects unchanged.          |
| `src/project/input.ts`                     | new      | Readonly `ProjectInput` interface.                              |
| `src/registry/snapshot.ts`                 | new      | Readonly `RegistrySnapshot`/`RegistryItemRef` interfaces.       |
| `src/codegen/plan.ts`                      | new      | Readonly `PlanningOutcome` interface.                           |
| `tests/unit/boundaries.test.ts`            | new      | Six boundary tests (pure, injected, compile-negative, imports). |
| `README.md`, `CONTRIBUTING.md`             | modified | Document the boundaries.                                        |
| `implementation/evidence/COMPATIBILITY.md` | modified | S012 addendum and cumulative results.                           |
| `implementation/COMMIT_SEQUENCE.md`        | modified | S011 pending review; S012 active.                               |

## Cumulative RCLD-01 verification (S012 milestone)

| Step                     | Command                                                                     | Exit | Result                                                 | Log                        |
| ------------------------ | --------------------------------------------------------------------------- | ---- | ------------------------------------------------------ | -------------------------- |
| Frozen strict install    | `pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict` | 0    | exit 0                                                 | `s012-install-frozen.log`  |
| Format check             | `pnpm run format:check`                                                     | 0    | All matched files use Prettier code style              | `s012-format-check.log`    |
| Lint                     | `pnpm run lint`                                                             | 0    | no findings                                            | `s012-lint.log`            |
| Typecheck (4 configs)    | `pnpm run typecheck`                                                        | 0    | exit 0                                                 | `s012-typecheck.log`       |
| Unit                     | `pnpm run test:unit`                                                        | 0    | 3 files; 20 tests, 20 pass                             | `s012-unit.log`            |
| Runner harness           | `pnpm run test:harness`                                                     | 0    | 35 tests, 35 pass                                      | `s012-harness.log`         |
| Integration              | `pnpm run test:integration`                                                 | 0    | 9 tests, 9 pass                                        | `s012-integration.log`     |
| Components               | `pnpm run test:components`                                                  | 0    | 4 tests, 4 pass                                        | `s012-components.log`      |
| CLI smoke                | `pnpm run test:cli-bootstrap`                                               | 0    | 41 tests, 41 pass                                      | `s012-cli.log`             |
| Fixture check            | `pnpm run fixture:check`                                                    | 0    | 0 errors, 0 warnings                                   | `s012-fixture-check.log`   |
| Fixture build            | `pnpm run fixture:build`                                                    | 0    | production Node-adapter build                          | `s012-fixture-build.log`   |
| Consumer SSR + lifecycle | `pnpm run test:fixture`                                                     | 0    | 17 tests, 17 pass                                      | `s012-test-fixture.log`    |
| Browser (Chromium)       | `pnpm run test:browser -- tests/browser/harness.spec.ts`                    | 0    | 11 passed                                              | `s012-browser.log`         |
| Contract validation      | `pnpm run check:contracts`                                                  | 0    | 0 error(s), 0 warning(s)                               | `s012-contracts-check.log` |
| Contract tests           | `pnpm run test:contracts`                                                   | 0    | 101 tests, 101 pass                                    | `s012-contracts-test.log`  |
| Workflow validation      | `actionlint .github/workflows/ci.yml`                                       | 0    | no findings (shellcheck 0.11.0 present)                | (terminal)                 |
| Reference fmt            | `cargo fmt --all -- --check`                                                | 0    | no diffs                                               | `s012-reference-fmt.log`   |
| Reference check          | `cargo check --workspace --all-targets`                                     | 0    | `Finished dev profile`                                 | `s012-reference-check.log` |
| Reference test           | `cargo test --workspace --all-targets`                                      | 0    | 578 passed, 0 failed, 4 ignored across 43 result lines | `s012-reference-test.log`  |
| Whitespace               | `git diff --check`                                                          | 0    | no diagnostics                                         | (terminal)                 |

The reference worktree was clean at
`a10fbf06334f4648f5755e05a7147414e4e5fc98` before and after the fresh guard and
was not modified. This is the single fresh reference guard for the batch; S007
through S011 reused the audited S007 evidence as authorized.

## Failed attempts

- The first S012 `typecheck` exited 2 because the `@ts-expect-error` directives
  were placed on the `const` line rather than the offending property line; moving
  them fixed it and the next run exited 0.
- No assertion was weakened and no failing lane was reported as passed.

## Limitations

- No product command, schema, registry read/validate, planning or transaction
  behavior is implemented or claimed.
- No package/tarball acceptance, publication, deployment or remote CI execution
  is claimed.
- Only macOS/Node 24.21.0 with bundled Chromium was exercised locally.
- The S007–S012 commits are pending independent Codex review; they do not count
  as accepted completion.

## Self-review findings

- The pure CLI modules perform no I/O; the adapter preserves the exact help,
  version, usage and exit behavior, and the S004 smoke mutation anchors remain.
- The boundary interfaces are type-only and add no behavior.
- The boundaries test proves no filesystem writes, adapter agreement,
  compile-negative rejection and consumer-import isolation.
- All cumulative lanes pass at this milestone.

## Commit and next action

Commit message: `core: separate cli registry and codegen boundaries`. Actual
commit: `14de6da6fbeb58af2a3843874e86c391e4a17051`. This closes the authorized
S007–S012 implementation batch; Codex independently reviews the sequence. S013
was not started and nothing was pushed or published.

## Batch return summary

The `pfc through RCLD-01` batch is complete. All six implementation checkpoints
are committed and pending independent review: S007
`99212955c2b812ef6bc525c9cdca14fae4e6499a`, S008
`f4dfa83aadc67850b6b8b999f80bd7199de4a6b2`, S009
`023cdf811505f5803ede334c57ee4a993073483e`, S010
`a148a3163e5fa38e4f684292c902ac5707637299`, S011
`64a1acb48ad552b0c6097b34b7c58f0cdbcf0c6f`, S012
`14de6da6fbeb58af2a3843874e86c391e4a17051`. The completed-checkpoint counter
stays `6 / 203` because pending review is not independent acceptance; the
authored pending-review range is `S007–S012`. No S013 work was performed.

## RCLD-01 repair addendum (2026-09-30)

Repair commit: `024495a0854ce4566678feb1dbb461a2f049e7a3` (not the original
pending hash above). The takeover dispatch's adapter-boundary finding is closed:

- `src/cli/main.ts` now delegates to the shared `runCli` executor instead of
  duplicating argument classification and dispatch; metadata validation and the
  real stdout/stderr/exit effects stay in the adapter.
- The hard-coded-version mutation control targets the adapter's delegation point,
  so the strengthened CLI smoke suite still rejects a hard-coded version.
- All 41 CLI smoke behaviors and the boundary/pure-import regressions pass.

Verified: CLI smoke 41/41, unit 20/20, harness 35/35, integration 12/12,
format/lint/typecheck green.

## Final independent review preparation — 2026-09-30

Reviewer: Codex. Tested combined source revision: `7d3401c9a19ca7915ff7f0c9c0280760c81b5509`.
Original implementation revision: `14de6da6fbeb58af2a3843874e86c391e4a17051`.
Applicable repair revisions: `024495a0854ce4566678feb1dbb461a2f049e7a3`, `49a82eca2942bcad3cad0844419481076edca003`.

Pure CLI parser/shared executor used by the actual adapter, readonly project/registry/planner boundaries, injected effects and no consumer imports of CLI/Node/registry internals.

Fresh Codex verification: format/lint/four-config typecheck; unit 20/20; runner harness 35/35; CLI smoke 41/41; fixture check zero errors/warnings; production build and SSR/lifecycle 23/23; components 22/22; Chromium 23/23; integration 15/15 with zero skips; contract validation zero errors/warnings and regressions 108/108. Independent prior-fault probes reject impossible/overflow totals and wrong workspaces, verify no version-test fixture leak, and verify valid PNG/ZIP signatures for all seven browser fault modes. The unchanged reference author-run fmt/check/test exits and logs were audited: 578 passed, zero failed, four ignored; these are not fresh Codex Rust executions. Fresh author checksum-verified actionlint 1.7.12 exited 0. Source, callers, all six original checkpoint criteria, prior reviews and the complete repair chain were inspected.

All applicable original checkpoint requirements and prior review findings pass
on this combined candidate. Structured metadata remains pending solely until
the approved whole-batch evidence commit and atomic acceptance transition.
The original snapshot did not contain the later repairs; preserve its history.

This accepts the bootstrap requirements only. The two genuine upstream Bits declaration complexity errors remain a qualified fixture-only exception and an open release AC20 obligation. Remote CI, other platforms, package/tarball acceptance, human release tests and the remaining 191 checkpoints are not accepted here. One author contract-fixture construction attempt reported ENOTEMPTY during cleanup and masked its cause; subsequent full author runs and the fresh Codex run pass. Preserve the failure and improve cause retention in the next tooling slice without claiming its cause was established.
