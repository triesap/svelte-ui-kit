# RCLD-04 Q4 cumulative qualification and completion evidence

Status: Pi-authored implementation, correction and cumulative qualification
evidence for the expanded `pfc through RCLD-04` dispatch. S064–S077 remain
`committed_pending_review`; the mandatory independent Codex S077 review before
S078 is still required. This report grants no acceptance and does not claim
whole RCLD-04 or MVP completion.

Original S001–S203 definitions, R01–R34, AC01–AC22, the accepted RCLD-01..RCLD-03
records, the derived projection and the live RCLD-04 authorization tuple are
unchanged. Counts remain 63 accepted / 14 committed_pending_review / 126
not_started.

## Corrections and extensions in this batch

1. **Owned namespace-removal faults** (`a6ed512`). `cleanupEmptyTransient` (apply)
   and `cleanupReleasedTransient` (both recovery callers) previously swallowed
   every `rmdir` error as a legitimate absence or non-empty guard. A real
   `EIO` on `_kit/.svelte-ui-kit/transactions` now yields a typed
   `COMMITTED_NEEDS_CLEANUP` (apply) or `RECOVERY_CLEANUP_FAILED` (single and
   scanned recovery) and stops destructive progress. Only `ENOENT`,
   `ENOTEMPTY` and `EEXIST` are treated as legitimate absence/non-empty state.
   Causal regressions drive the actual syscall fault through guarded apply and
   both exported recovery entry points, with an unrelated-entry control.
2. **Captured production restart and whole-tree proof** (`a73f5af`). A new
   subprocess worker replays the real `captureSnapshot` → `planInit` →
   `composeApplyPlan` → `validateApplyPlan` → `applyPlan` boundary for the
   default and an independently rooted custom mapping, is `SIGKILL`ed at the
   post-release cleanup tail, and is finished by a fresh recovery process whose
   resulting tree is compared exactly against a clean reference commit. A second
   captured production kill while coordination is held fails closed with
   `WRITER_BUSY`, retained owner/transaction evidence and no tree mutation.
   Return-review follow-up (`70b57a4`, `implementation/evidence/RCLD04_RETURN_REVIEW.md`)
   now launches that recovery in a genuinely separate child process with an
   attributable PID/exit/signal/output envelope through both exported callers.
3. **Truthful outcome reconciliation.** The unreadable-namespace regression now
   asserts that all recovery rows are refusals (the additional truthful
   `ENOTDIR` cleanup refusal is not reported as clean), retaining the original
   `RECOVERY_SCAN_UNSAFE` intent.

## Cumulative lanes

Environment: Node `v24.21.0`, pnpm `11.22.0`, macOS arm64 (Darwin 25.5),
single-volume host. Every lane is a portable repository command; raw outputs,
underlying exits and identity are retained under the git-ignored
`implementation/evidence/logs/rcld04-q4-<timestamp>/` tree.

| Lane                                                                        | Result                                                | Exit |
| --------------------------------------------------------------------------- | ----------------------------------------------------- | ---- |
| `pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict` | up to date                                            | 0    |
| `pnpm run build`                                                            | built                                                 | 0    |
| `pnpm run typecheck`                                                        | 0 errors across five configs                          | 0    |
| `pnpm run format:check`                                                     | clean                                                 | 0    |
| `pnpm run lint`                                                             | 0 warnings / 0 errors                                 | 0    |
| `pnpm run test:unit`                                                        | 283 pass / 0 fail / 0 skip / 0 todo                   | 0    |
| `pnpm run test:integration`                                                 | 494 pass / 0 fail / 0 skip / 0 todo                   | 0    |
| `pnpm run test:registry`                                                    | 38 pass / 0 fail                                      | 0    |
| `pnpm run test:cli-bootstrap`                                               | 52 pass / 0 fail                                      | 0    |
| `pnpm run test:harness`                                                     | 37 pass / 0 fail                                      | 0    |
| `pnpm run test:components`                                                  | 22 pass / 0 fail (strict declaration 17/17)           | 0    |
| `pnpm run fixture:check`                                                    | 0 errors / 0 warnings                                 | 0    |
| `pnpm run fixture:build`                                                    | built                                                 | 0    |
| `pnpm run test:fixture`                                                     | 27 pass / 0 fail (six default/custom consumer stages) | 0    |
| `pnpm run test:browser`                                                     | 23 pass / 0 fail                                      | 0    |
| `node tools/check-contracts.mjs --generate`                                 | projection unchanged                                  | 0    |
| `pnpm run check:contracts`                                                  | 0 error(s) / 0 warning(s)                             | 0    |
| `pnpm run test:contracts`                                                   | 137 pass / 0 fail                                     | 0    |
| actionlint 1.7.12 on `.github/workflows/ci.yml`                             | no findings (shellcheck 0.11.0)                       | 0    |
| reference `cargo fmt --all -- --check`                                      | clean                                                 | 0    |
| reference `cargo check --workspace --all-targets`                           | finished                                              | 0    |
| reference `cargo test --workspace --all-targets`                            | 578 passed / 0 failed / 4 ignored                     | 0    |

Actionlint provenance: archive
`actionlint_1.7.12_darwin_arm64.tar.gz`, SHA-256
`aba9ced2dee8d27fecca3dc7feb1a7f9a52caefa1eb46f3271ea66b6e0e6953f`; binary
SHA-256 `8db11704dc296f096216db4db65d86cd7f0ebfdf4c38453a1da276b137b88388`,
version 1.7.12. The read-only reference workspace stayed clean at
`a10fbf06334f4648f5755e05a7147414e4e5fc98`.

## S064–S077 disposition

Every row is an executed production path; acceptance remains with Codex.

| Checkpoint | Implementation / caller                                                     | Qualification evidence                                                                                                                                        |
| ---------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S064       | frozen phases, transitions and terminal dispositions in `transaction-types` | `unit/transaction-state`, `transaction-safety`                                                                                                                |
| S065       | strict journal parse/validation in `transaction-journal`                    | `unit/transaction-journal`, `recovery-ownership`, `recovery-invalid`                                                                                          |
| S066       | exclusive writer coordination in `write-lock`                               | `write-lock`, `transaction-processes`, captured production held-writer refusal                                                                                |
| S067       | preimage/readset revalidation in `revalidate` and `authority`               | `revalidate`, `compose-authority`, `transaction-authority`                                                                                                    |
| S068       | owned same-filesystem staging in `stage` and `durability`                   | `staging`, `durability-ordering`, `durability-flush-paths`                                                                                                    |
| S069       | recoverable prepared journal in `transaction-journal`                       | `journal-preparation`, `recovery-prepublication`                                                                                                              |
| S070       | per-file replacement and progress in `replace`                              | `replacement`, `replacement-guards`, `recovery-prepublication`                                                                                                |
| S071       | canonical lock published last in `publish-lock` and `publication-intent`    | `lock-publication`, `publication-witness`, `lock-projection`                                                                                                  |
| S072       | evidence-safe transaction cleanup in `transaction-cleanup`                  | `transaction-cleanup`, `durability-flush-paths`, Q3 namespace-removal cases                                                                                   |
| S073       | prepublication rollback in `recovery`                                       | `recovery-prepublication`, `recovery-invalid`, captured production restart matrix                                                                             |
| S074       | published recovery and cleanup tail in `recovery`                           | `recovery-published`, `cleanup-restart-matrix`                                                                                                                |
| S075       | corrupt/ambiguous fail-closed recovery in `recovery` and `owned-ancestry`   | `recovery-ownership`, `recovery-invalid`, historical review-16 probes replay safe                                                                             |
| S076       | concurrency and process interruption in helpers/tests                       | `transaction-processes`, `cleanup-restart-matrix`, captured production SIGKILL restart                                                                        |
| S077       | composed guarded apply use case in `apply`                                  | `guarded-composition`, `composed-lifecycle`, `review16-matrix`, `multi-item-lifecycle`, `q2-multi-item-dispositions`, `planned-consumer`, six consumer stages |

## RCLD04-R2 dispositions

| Finding | Disposition                                                                                                                   |
| ------- | ----------------------------------------------------------------------------------------------------------------------------- |
| R2-1    | Structured authority validated before digest/sealing/effects; historical review-16 authority probes replay safe.              |
| R2-2    | Physical/staged/durability boundaries and same-filesystem refusal qualified; flush and removal faults are causal.             |
| R2-3    | Publication uniquely bound to the staged physical witness; changed/same-byte, missing/replaced/edited witness cases refuse.   |
| R2-4    | Recovery validates complete owned inventory and binding before effects; both exported callers return typed truthful outcomes. |
| R2-5    | Default/custom add/update/retirement/metadata/satisfied/conflict/cohort matrix and six resulting-consumer stages are covered. |

## Preserved exceptions and open debt

- AC20's exactly two fixture-only upstream Bits 2.19.3 TS2590 declarations and
  the strict-17 declaration controls are preserved and not waived.
- The four reference Rust tests listed below remain ignored existing debt, not
  newly waived:
  `installed_binaries_run_after_package_source_and_build_state_are_deleted`,
  `homepage_fixture_cli_workflow_smoke`,
  `tests::every_transaction_io_fault_avoids_partial_application_state`,
  `packaged_sources_build_with_cargo_vcs_provenance_outside_and_inside_hostile_git`.

## Honestly unrun

- Windows and a second physical cross-device host were not executed; no
  device-dependent claim is made beyond the deterministic single-volume
  software controls.
- Remote CI dispatch was not performed; the workflow file was validated locally
  with checksum-qualified actionlint.
- Later gates S078, CLI S081 and catalog S096/S097 remain gated and were not
  entered.

## Disposition

All original S064–S077 checkpoints remain `committed_pending_review`; none is
self-accepted. S078 stays gated on independent Codex S077 acceptance of the
completed RCLD-04 candidate. Pi records implementation and evidence only.
