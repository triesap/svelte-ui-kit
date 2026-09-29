# S012 step report — Separate orchestration and pure module interfaces

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S012","kind":"report","commit":null,"disposition":"candidate"}
-->

Step ID and title: S012 — Separate orchestration and pure module interfaces.

Contract/requirement IDs: R01, R02, R03, R15, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/ARCHITECTURE.md`,
`specs/COMPONENT_CATALOG.md`, `specs/GENERATED_LAYOUT.md`,
`specs/PRODUCT_SPEC.md`, `specs/SECURITY_AND_TRANSACTIONS.md`,
`specs/SYNCHRONIZATION.md`).

Author: Pi, provider `ollama`, model `deepseek-v4.1-flash:cloud`. Runtime:
process-local Node `24.21.0` / `pnpm 11.22.0`, after `cargo extbuild doctor`
(exit 0), with mutating commands routed through `cargo extbuild run --`. No new
dependency was added.

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

Commit message: `core: separate cli registry and codegen boundaries`. The commit
hash is recorded in this report's evidence after the commit. This closes the
authorized S007–S012 implementation batch; Codex independently reviews the
sequence. S013 was not started and nothing was pushed or published.
