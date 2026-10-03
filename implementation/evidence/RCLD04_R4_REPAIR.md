# RCLD-04 review-14 repair and qualification evidence

Status: Pi-authored implementation and verification evidence for independent
review 14. S064–S077 remain `committed_pending_review`; independent Codex
acceptance is required before S078. This is not an acceptance decision. It
supersedes the overbroad group-complete claims in `RCLD04_R3_REPAIR.md` (kept as
history) and builds on `RCLD04_R2_REPAIR.md`/`RCLD04_R1_REPAIR.md`.

Original S064–S077 definitions, R01–R34, AC01–AC22, the accepted RCLD-01..RCLD-03
records, the accepted pure planner behavior and the live RCLD-04 authorization
tuple are unchanged. Counts remain 63 accepted / 14 committed_pending_review /
126 not_started and three complete / eight unfinished sequences.

## Review-14 repairs (ordered commits)

1. `5964e7e` — `codegen: complete RCLD-04 review-14 authority and recovery repairs`
   - Installed resolution authority: `captureEnvironment` now records each
     dependency's resolved manifest path, real path and physical identity (or
     proven absence), carried into the guarded apply read set by
     `composeApplyPlan`. `verifyInstalledReads` re-runs the nearest
     `node_modules` lookup and refuses a changed hoisted manifest
     (`AUTHORITY_INSTALLED_CHANGED`), a nearer shadowing install, a retargeted
     dependency link with equal bytes, and an appeared/disappeared resolution.
   - Captured ignore authority: `composeApplyPlan` refuses an unobserved or
     unsafe/undecodable required `.gitignore` as `COMPOSE_IGNORE_UNOBSERVED` /
     `COMPOSE_IGNORE_UNSAFE` instead of silently skipping it.
   - Ignore recovery role: the journal records its narrowly approved ignore
     files; `validateJournalTargets` accepts exactly those recorded allowlisted
     ignore targets so guarded ignore rollback no longer fails
     `JOURNAL_TARGET_UNAPPROVED`.
   - Created-directory scope: `recovery` validates every recorded created
     directory against the approved mapping, the planned operation ancestor
     chains and a safe real-directory ancestry before any removal; an arbitrary
     unrelated directory claim is refused and preserved
     (`RECOVERY_CREATED_DIR_UNAPPROVED`).
   - Coordination possession: `write-lock` records actually acquired
     in-process handles; recovery proves possession from that registry, so a
     foreign owner record that merely names this PID is refused `WRITER_BUSY`
     with evidence retained.
   - Release-failure reporting: exported recovery now reports a failed
     coordination release and retained owner evidence instead of discarding it.
   - Publication witness identity: recovery binds the witness root/plan digest
     to the recovered journal in the applied and cleanup-tail paths and preserves
     contradictory evidence.
   - Full mapping context: guarded final-lock validation now passes the approved
     `uiDir`/`stylesDir`/`stateDir` context, so an outside-UI ownership claim is
     rejected (`LOCK_NAMESPACE`).
2. `24241e4` — `codegen: flush the parents of owned creation and cleanup removals`
   - Parent flushes for each newly created coordination/generated ancestry
     directory, each owned cleanup removal, the final transaction-directory
     removal and the writer-lock release.
3. `5db8033` — `test: qualify shipped-registry default and custom lifecycle consumers`
   - The actual bundled registry drives default init, `pnpm run check` of the
     generated consumer, and satisfied `planSync` replay; a custom mapping
     satisfied sync replays through the guarded path.
4. `b3ef41d` — `codegen: refuse a nonregular publication witness as unsafe evidence`
   - `readPublicationIntent` rejects a symlinked/nonregular witness instead of
     following it.
5. `d9a558d` — `codegen: document bounded stale-writer recovery and test durability faults`
   - `implementation/OPERATIONS_RUNBOOK.md` documents the bounded operator step
     for a stale killed-writer lock and proves automatic `WRITER_BUSY` refusal
     must precede it.
   - Added regressions for a real `fsync` `EIO` during cleanup (truthful
     `committed_needs_cleanup`, evidence retained) and the automatic refusal of
     a stale dead-writer lock before the documented removal.

Repository-owned regressions: `tests/integration/review14-repairs.test.ts`
(9 cases), extended `tests/integration/durability-flush-paths.test.ts` (4
cases), extended `tests/integration/publication-witness.test.ts` (1 case) and
extended `tests/integration/composed-lifecycle.test.ts` (2 cases).

## Final candidate qualification

Environment: Node `v24.21.0`, pnpm `11.22.0`, macOS Darwin 25.5 arm64,
single-volume host. Every lane below was routed through
`cargo extbuild run --` after a green `cargo extbuild doctor`; raw logs and
underlying exits are retained under the ignored
`implementation/evidence/logs/rcl04-review14/` path.

| Lane                                                                                 | Result                        | Exit |
| ------------------------------------------------------------------------------------ | ----------------------------- | ---- |
| `pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict`          | installed                     | 0    |
| `pnpm run build`                                                                     | built                         | 0    |
| `pnpm run typecheck`                                                                 | 0 errors                      | 0    |
| `pnpm run format:check`                                                              | clean                         | 0    |
| `pnpm run lint`                                                                      | 0 warnings/errors             | 0    |
| `pnpm run test:unit`                                                                 | 278 pass / 0 fail / 0 skip    | 0    |
| `pnpm run test:integration`                                                          | 428 pass / 0 fail / 0 skip    | 0    |
| `pnpm run test:registry`                                                             | 38 pass / 0 fail              | 0    |
| `pnpm run test:cli-bootstrap`                                                        | 52 pass / 0 fail              | 0    |
| `pnpm run test:harness`                                                              | 37 pass / 0 fail              | 0    |
| `pnpm run test:components`                                                           | 22 pass / 0 fail              | 0    |
| `pnpm run fixture:check`                                                             | 0 errors / 0 warnings         | 0    |
| `pnpm run fixture:build`                                                             | built                         | 0    |
| `pnpm run test:fixture`                                                              | 23 pass / 0 fail              | 0    |
| `pnpm run test:browser`                                                              | Chromium 23 pass / 0 fail     | 0    |
| `node tools/check-contracts.mjs --generate`                                          | projection unchanged          | 0    |
| `pnpm run check:contracts`                                                           | 0 errors / 0 warnings         | 0    |
| `pnpm run test:contracts`                                                            | 137 pass / 0 fail / 0 skip    | 0    |
| `go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.12 .github/workflows/ci.yml` | no findings                   | 0    |
| reference `leptos_ui_kit` `cargo fmt --all -- --check`                               | clean                         | 0    |
| reference `cargo check --workspace --all-targets`                                    | clean                         | 0    |
| reference `cargo test --workspace --all-targets`                                     | 578 pass / 0 fail / 4 ignored | 0    |

The reference `leptos_ui_kit` stayed at clean
`a10fbf06334f4648f5755e05a7147414e4e5fc98` with no edits. Its four ignored Rust
tests are the separate baseline limitation, not the fixture-only two upstream
Bits TS2590/strict-declaration exception; AC20 remains open release debt.

## Coverage and remaining gaps (honest)

| Group                                       | State                                                                                                                                                                                                                                    | Remaining                                                                                                                                                                                                                                                                              |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R2-1 authority                              | Installed resolution/link/absence evidence is captured and revalidated; full mapping context enforced in guarded lock validation.                                                                                                        | Exhaustive per-layout enumeration evidence for every hoisting arrangement and a layout-integration path context are not exhaustively qualified; the empty shipped catalog limits real-item add coverage.                                                                               |
| R2-2 bootstrap/ignore/filesystem/durability | Captured ignore authority and its recovery role; owned-directory creation scope; parent flushes for creation, cleanup and release; same-filesystem refusal; real `fsync` `EIO` failure and crash-order refusal with retained evidence.   | A real cross-device lane is not executed on this single-volume host; the metadata-only cross-device negative path is implemented as a typed refusal but not exercised against a second device.                                                                                         |
| R2-3 publication                            | Physical image/mode/kind and witness plan/root binding in every published and cleanup-tail path; nonregular witness refused.                                                                                                             | No remaining deterministic matrix gap identified beyond genuine second-device lanes.                                                                                                                                                                                                   |
| R2-4 recovery                               | Acquired-handle possession, release-failure reporting, created-directory scope, root/plan/phase/progress/inventory preflight; bounded stale-writer operator procedure documented and automatic refusal proven.                           | Exported recovery retains truthful issues; no force/recover flag or PID/age takeover was added.                                                                                                                                                                                        |
| R2-5 lifecycle/process                      | Shipped-registry default init + consumer check + satisfied sync; custom satisfied sync; controlled-variant add/update/retirement/conflict; guarded process contention and SIGKILL recovery; metadata-only and satisfied no-change paths. | Real add/sync against a populated shipped catalog is not possible before the component sequences populate `registry/`; a full CLI-level guarded restart (`applyPlan`) after a SIGKILL, custom add/sync with real items and a second cross-device/platform lane remain to be qualified. |

## Disposition

All original S064–S077 checkpoints remain `committed_pending_review`; none is
self-accepted. S078 stays gated on independent Codex acceptance of the completed
RCLD-04 boundary. Historical provenance in the earlier repair records is kept.
