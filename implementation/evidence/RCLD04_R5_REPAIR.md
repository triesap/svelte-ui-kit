# RCLD-04 review-15 repair and qualification evidence

Status: Pi-authored implementation and verification evidence for independent
review 15. S064–S077 remain `committed_pending_review`; independent Codex
acceptance is required before S078. This is not an acceptance decision. It
supersedes the review-14 disposition in `RCLD04_R4_REPAIR.md` (kept as history)
and builds on `RCLD04_R3_REPAIR.md`, `RCLD04_R2_REPAIR.md` and
`RCLD04_R1_REPAIR.md`.

Original S064–S077 definitions, R01–R34, AC01–AC22, the accepted RCLD-01..RCLD-03
records, the accepted pure-planner behavior and the live RCLD-04 authorization
tuple are unchanged. Counts remain 63 accepted / 14 committed_pending_review /
126 not_started and three complete / eight unfinished sequences.

## Review-15 repairs (ordered commits)

1. `e519a14` — `codegen: complete RCLD-04 review-15 authority, ancestry and capture repairs`
   - Coordination authority: `write-lock` records the acquired transaction id
     with each in-process handle; recovery re-proves the live physical owner
     record (`verifyHeldWriterLock`) before any recovery effect, so a registered
     acquisition can never bypass a contradictory live owner
     (`WRITER_LOCK_CONTRADICTED`).
   - Release durability: a failed release always drops the in-process claim and,
     when the owner record was already unlinked but the lock directory survives,
     restores the exact validated owner record so no reusable stale authority or
     ownerless lock remains (`WRITER_LOCK_RELEASE_FAILED`).
   - Exported recovery outcomes: transaction cleanup returns typed
     `RECOVERY_CLEANUP_FAILED` issues instead of throwing, including a failure of
     the final owned directory removal after the journal was removed.
   - Generated ancestry: `recovery` approves independently rooted UI/styles/layout
     ancestors in either containment direction, so a custom `assets/styles` root
     rolls back its legitimate `assets` ancestor instead of refusing
     `RECOVERY_CREATED_DIR_UNAPPROVED`.
   - Creation/removal durability: `createOwnedAncestors` returns the already
     created directories together with a typed `OWNED_ANCESTRY_FLUSH_FAILED`
     issue, and `removeOwnedAncestors` distinguishes a genuine nonempty/removal
     failure from a post-removal flush fault (`RECOVERY_ANCESTRY_FLUSH_FAILED`)
     rather than mislabeling every I/O failure as nonempty.
   - Installed capture: `captureEnvironment` enumerates the union of installed
     and declared dependency names, so a declared-but-absent lookup is captured
     as explicit absence and a later-appearing incompatible install is refused
     (`AUTHORITY_INSTALLED_CHANGED`). `resolveInstalledManifestCandidate` and
     `verifyInstalledReads` preserve a symlinked/nonregular resolution as
     `unsafe`/`unreadable` instead of collapsing it into absence.
   - Typed validation: `validateApplyPlan` strictly validates `ignoreFiles` as a
     list of approved managed ignore paths (`PLAN_IGNORE_INVALID`,
     `PLAN_IGNORE_UNAPPROVED`, `PLAN_IGNORE_DUPLICATE`) before any effect, and
     passes the approved layout mapping into every lock validation. A layout
     integration that names a different path is refused (`LOCK_LAYOUT_CONTEXT`)
     across guarded final-lock, publish, init, add and sync validation.
   - The local runtime evidence-log tree (`implementation/evidence/logs/`) is
     ignored so raw logs and checksum inventories are never committed.
2. `1a23254` — `test: qualify guarded restart through the production apply core`
   - A real subprocess SIGKILL leaves a prepared journal; `applyPlan` refuses the
     orphaned dead writer lock automatically (`WRITER_BUSY`) before any recovery
     effect, and a fresh observation/planning pass after the documented bounded
     operator step completes a coordinated restart that recovers the killed
     writer's transaction.
3. `59c3a8d` / `6c89ffe` — `test: qualify a compound multi-item lifecycle through the guarded core`
   - A contract-conforming two-item fixture (explicit registry dependency,
     transitive closure, hybrid Svelte/TypeScript files, multiple shared CSS
     blocks in distinct cohorts and value/type export cohorts) is driven through
     `planAdd`/`planSync`, `composeApplyPlan`, `validateApplyPlan` and `applyPlan`.
     Update and retirement change only the targeted owner's outputs and CSS
     blocks, leaving unrelated content and the retained cohort intact.

Repository-owned regressions: `tests/integration/review15-repairs.test.ts`
(10 cases) and `tests/integration/multi-item-lifecycle.test.ts` (2 cases).

## Final candidate qualification

Environment: Node `v24.21.0`, pnpm `11.22.0`, macOS Darwin 25.5 arm64,
single-volume host. Every lane below is a portable repository command; raw logs
and underlying exits are retained under the ignored local evidence-log tree.

| Lane                                                                                 | Result                        | Exit |
| ------------------------------------------------------------------------------------ | ----------------------------- | ---- |
| `pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict`          | installed                     | 0    |
| `pnpm run build`                                                                     | built                         | 0    |
| `pnpm run typecheck`                                                                 | 0 errors                      | 0    |
| `pnpm run format:check`                                                              | clean                         | 0    |
| `pnpm run lint`                                                                      | 0 warnings/errors             | 0    |
| `pnpm run test:unit`                                                                 | 278 pass / 0 fail / 0 skip    | 0    |
| `pnpm run test:integration`                                                          | 440 pass / 0 fail / 0 skip    | 0    |
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
tests are a separate baseline limitation, not the fixture-only two upstream Bits
TS2590/strict-declaration exception; AC20 remains open release debt.

## Coverage and remaining gaps (honest)

| Group                                       | State                                                                                                                                                                                                                                     | Remaining                                                                                                                                                                                                      |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R2-1 authority                              | Complete declared/installed/absence capture with declared-name enumeration; unsafe/unreadable preserved; malformed ignore and layout lock authority typed; full mapping context passed on every lock validation path.                     | No deterministic gap identified; a genuinely different physical hoisting platform remains an environment lane.                                                                                                 |
| R2-2 bootstrap/ignore/filesystem/durability | Independently rooted ancestors approved in either direction; partial creation and post-removal flush faults typed and accounted; captured ignore authority and its recovery role; same-filesystem refusal; crash-order refusal.           | A real cross-device lane is not executed on this single-volume host; the metadata-only cross-device negative path is a typed refusal but is not exercised against a second physical device.                    |
| R2-3 publication                            | Physical image/mode/kind and witness plan/root binding in every published and cleanup-tail path; nonregular witness refused; contradictory evidence preserved.                                                                            | No remaining deterministic matrix gap identified beyond genuine second-device lanes.                                                                                                                           |
| R2-4 recovery                               | Authentic live owner re-proved before in-process recovery; failed release drops stale authority and retains validated owner evidence; whole-journal/inventory/created-directory preflight; typed truthful exported partial outcomes.      | No force/recover flag or PID/age takeover was added by design.                                                                                                                                                 |
| R2-5 lifecycle/process                      | Shipped-foundation init/check/satisfied sync; compound multi-item add/update/retirement with dependencies, hybrid files, multiple CSS blocks and export cohorts; guarded subprocess contention, SIGKILL recovery and coordinated restart. | A populated shipped-catalog add/sync and the CLI init/add/sync commands remain later dependency gates (S081, S096/S097); Windows and a second physical device are unrun platform lanes, not software blockers. |

## Disposition

All original S064–S077 checkpoints remain `committed_pending_review`; none is
self-accepted. S078 stays gated on independent Codex acceptance of the completed
RCLD-04 boundary. Historical provenance in the earlier repair records is kept.
