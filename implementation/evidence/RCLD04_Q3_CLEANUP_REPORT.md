# RCLD-04 Q3 cleanup and restart qualification evidence

Status: Pi-authored implementation and verification evidence for the bounded
`pfc RCLD04-Q3-CLEANUP` dispatch. S064–S077 remain `committed_pending_review`;
independent Codex acceptance of the complete boundary is still required before
S078. This is not an acceptance decision and does not claim whole RCLD-04/MVP
completion. It builds on `RCLD04_R6_REPAIR.md`, `RCLD04_Q2_REPORT.md` and
`RCLD04_Q1_REPORT.md`, which are retained as provenance.

Original S001–S203 definitions, R01–R34, AC01–AC22, the accepted RCLD-01..RCLD-03
records and the live RCLD-04 authorization tuple are unchanged. Counts remain
63 accepted / 14 committed_pending_review / 126 not_started, and the independent
S077/S078 gate is untouched.

## Ordered green commits

1. `1983696` — `test: bind generated markup assertion to its element`
   - Adopted the three current dispatch governance amendments (`AGENTS.md`,
     `implementation/COMMIT_SEQUENCE.md`, `implementation/VERIFICATION.md`).
   - `assertGeneratedComponentMarkup` now isolates the marked element's own
     content up to that element's closing tag and requires the expected text
     _inside_ it, so an empty marked element followed by the same text in an
     unrelated later element cannot pass. Wrapper-only, script-only,
     comment-only, missing, stale and unexpected-marker negatives are preserved.
   - Added the outside-element-text negative control to the maintained
     consumer/assertion suite.
   - Added the required exact whole-tree preservation assertion to the ENOTDIR
     installed-authority refusal case.
2. `e89853a` — `fix: retain cleanup proof when durability flushes fail`
   - `applyPlan` now propagates a real post-release empty-namespace flush failure
     as a truthful `committed_needs_cleanup` outcome instead of a false
     `applied` success. A published batch is never rolled back for a cleanup
     failure.
   - Standalone `recoverTransaction` and scanned `recoverTransactions` no longer
     swallow the same namespace-flush failure: the single entry point returns a
     typed refusal and the scanned entry point exposes the failure as an
     additional refused row rather than returning only clean rows.
   - Recovery transaction cleanup removes the ephemeral owned entries first and
     makes those removals durable before removing the authoritative
     journal/publication witness. A failed prerequisite stops destructive
     progress and retains the journal and transaction directory for a
     coordinated retry. The adjacent normal transaction cleanup was audited and
     already stops on a failed target flush.
   - Added causal `fsync`-fault tests through guarded apply and both exported
     recovery entry points, plus the transaction-directory flush case.
3. `8fbe898` — `fix: remove recovery-created empty state ancestry`
   - Repaired a further defect in this shared boundary: a standalone recovery on
     a root without a pre-existing state directory acquired coordination,
     released it, and then left the empty owned state-directory ancestry behind.
     Recovery now removes only the empty coordination ancestry it created (with
     parent flushes) and reports any removal fault; a non-empty committed state
     directory is preserved.
   - Added `tests/integration/cleanup-restart-matrix.test.ts`: real captured
     `planInit`/`composeApplyPlan`/`validateApplyPlan`/`applyPlan` normal,
     prepublication-refusal and metadata-only dispositions for default and custom
     mappings, plus real SIGKILL subprocess restart and fail-closed
     held-coordination cases.
4. This report — `docs: record RCLD-04 Q3 cleanup and restart qualification`.

## Dispatch findings disposition

| Finding                                                                                                                          | Correction                                                                                                                              | Evidence                                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. `applyPlan` swallowed the final parent `fsync` EIO after empty transient removal and returned `applied` with no issues.       | `cleanupEmptyTransient` returns typed issues; the guarded tail downgrades `applied` to `committed_needs_cleanup` and retains the issue. | `durability-flush-paths` "applyPlan reports committed_needs_cleanup when the post-release flush fails"; private cleanup probe `apply-tail`. |
| 2. `recoverTransaction`/`recoverTransactions` swallowed the same final removal flush and returned only clean outcomes.           | Both entry points return the typed namespace-flush issue; scanned recovery appends a refused row so the aggregate cannot look clean.    | `durability-flush-paths` two recovery cases; private `single-recovery-tail` / `scanned-recovery-tail`.                                      |
| 3. `removeOwnedEntries` recorded the transaction-directory flush failure but continued removing the directory, losing its proof. | Ephemeral removals are flushed before the journal/witness is removed; a failed prerequisite returns immediately with proof retained.    | `recovery-prepublication` "a transaction-directory flush failure retains the journal and directory"; private `recovery-transaction-flush`.  |
| 3b. Audit of adjacent normal transaction cleanup ordering (same boundary).                                                       | Audited: `cleanupTransaction` already stops at the first failed removal flush and does not remove the directory afterwards.             | `transaction-cleanup`, `publication-witness`, `recovery-ownership` remain green.                                                            |
| 4. `assertGeneratedComponentMarkup` spanned closing element boundaries; empty generated elements plus later text still passed.   | Content is captured within the marked element's own closing tag; the expected flat fixture text must be inside that element.            | `q2-resulting-consumer` positive + causal negatives incl. outside-element-text; private markup probe.                                       |
| 5. The ENOTDIR installed-authority case lacked the required exact full-tree preservation assertion.                              | The refusal now snapshots and compares the complete selected root before/after.                                                         | `compose-authority` "an unreadable/incomplete enumeration is distinct from absence and refused".                                            |
| New: standalone recovery left its created empty state-directory ancestry behind.                                                 | Recovery removes only the empty coordination ancestry it created and reports removal faults.                                            | `cleanup-restart-matrix` prepublication cases assert the exact captured tree after a fresh recovery.                                        |     | New: `cleanupEmptyTransient`/`cleanupReleasedTransient` swallowed a real `rmdir` EIO on `_kit/.svelte-ui-kit/transactions` and reported clean. | Legitimate `ENOENT`/`ENOTEMPTY`/`EEXIST` absence or non-empty state is distinguished from unexpected I/O/permission/kind faults, which return typed `COMMITTED_NEEDS_CLEANUP` (apply) or `RECOVERY_CLEANUP_FAILED` (both recovery callers) and stop destructive progress. | `durability-flush-paths` "applyPlan reports committed_needs_cleanup when the owned namespace removal fails", both recovery namespace-removal cases, and the unrelated-entry control. |

## Factual cleanup/restart matrix

Every row is an executed production path with repository-owned assertions.

| Scenario                                    | Production path                                                               | Assertions                                                                                                                                        | Where                                     |
| ------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Prepublication refusal (default)            | captured `planInit` → `composeApplyPlan` → `validateApplyPlan` → `applyPlan`  | typed `refused`; complete tree restored exactly; no lock published; no unrelated-state change; fresh recovery leaves no residue                   | `cleanup-restart-matrix`                  |
| Prepublication refusal (custom)             | same                                                                          | same under `app/ui`, `assets/styles`                                                                                                              | `cleanup-restart-matrix`                  |
| Normal commit (default)                     | same                                                                          | `applied`; exact planned tree/modes/bytes; transient namespace gone; unrelated `package.json`/notes preserved; fresh recovery changes nothing     | `cleanup-restart-matrix`                  |
| Normal commit (custom)                      | same                                                                          | same under custom roots                                                                                                                           | `cleanup-restart-matrix`                  |
| Metadata-only commit                        | real registry → captured `planInit` → guarded apply                           | only `kit.lock.json` written; exact tree; fresh recovery changes nothing                                                                          | `cleanup-restart-matrix`                  |
| Post-release process termination            | real SIGKILL worker during `durability:release` → fresh `recoverTransactions` | committed bytes preserved; canonical lock present; writer lock released; fresh recovery finishes the empty namespace without refusal              | `cleanup-restart-matrix`                  |
| Killed while coordination held              | real SIGKILL worker during `lock:publish` → fresh `recoverTransactions`       | typed `WRITER_BUSY` refusal; owner lock and unresolved transaction evidence retained; no PID-death takeover or manual lock removal                | `cleanup-restart-matrix`                  |
| Apply post-release flush fault              | guarded `applyPlan` + real `fsync` EIO                                        | `committed_needs_cleanup`; committed bytes preserved; typed issue                                                                                 | `durability-flush-paths`                  |
| Standalone/scanned recovery flush fault     | `recoverTransaction` / `recoverTransactions` + real `fsync` EIO               | single refusal / aggregate refused row; no false clean result                                                                                     | `durability-flush-paths`                  |
| Transaction-directory flush fault           | `recoverTransaction` + real `fsync` EIO                                       | typed refusal; journal and transaction directory retained                                                                                         | `recovery-prepublication`                 |
| Generated-markup causality                  | assertion helper + real SSR                                                   | positive plus wrapper-only, script/comment-only, missing, stale, unexpected and outside-element-text negatives; six real SSR stage controls green | `q2-resulting-consumer`, `ssr-assertions` |
| Installed unreadable/incomplete enumeration | captured snapshot → compose → validate → guarded apply                        | typed `AUTHORITY_INSTALLED_CHANGED`; exact full selected-root preservation                                                                        | `compose-authority`                       |

## Final candidate qualification

Environment: Node `v24.21.0`, pnpm `11.22.0`, macOS arm64, single-volume host.
Every lane is a portable repository command; raw logs, exits and identity are
retained as ignored local runtime evidence under
`implementation/evidence/logs/q3cleanup-<timestamp>/`.

| Lane                                                | Result                                            | Exit |
| --------------------------------------------------- | ------------------------------------------------- | ---- |
| `pnpm run build`                                    | built                                             | 0    |
| `pnpm run typecheck`                                | 0 errors across five configs                      | 0    |
| `pnpm run format:check`                             | clean                                             | 0    |
| `pnpm run lint`                                     | 0 warnings / 0 errors                             | 0    |
| `node tools/check-contracts.mjs --generate`         | projection unchanged                              | 0    |
| `pnpm run check:contracts`                          | 0 errors / 0 warnings                             | 0    |
| `node tools/run-unit-tests.mjs --suite integration` | 486 pass / 0 fail / 0 skip / 0 todo               | 0    |
| `pnpm run test:fixture`                             | 27 pass / 0 fail (six consumer stages + controls) | 0    |

The independent review cleanup and markup probes were replayed against the fresh
build: all four cleanup scenarios now produce typed, truthful outcomes instead
of false clean successes, and the markup outside-element-text control is
rejected while the positive control and wrapper-only negative still behave.
Private probe paths and outputs are retained only in ignored local evidence.

## Honestly unrun and open

- A real second physical device (cross-device) and Windows remain unexecuted
  platform lanes; no new device-dependent claim is made here.
- Q4 (full cumulative install/unit/integration/browser/CI/reference
  reconciliation) was completed in the expanded `pfc through RCLD-04` batch and
  is recorded in `implementation/evidence/RCLD04_Q4_REPORT.md`; the remaining
  structured-authority/publication/durability criteria were likewise qualified
  there. This Q3 report is retained as provenance for its scoped corrections.
- AC20's two pinned upstream Bits TS2590 fixture exceptions and the four ignored
  reference Rust tests remain explicit debt, unchanged and not waived.
- The read-only reference repository stayed unmodified at
  `a10fbf06334f4648f5755e05a7147414e4e5fc98`.

## Disposition

All original S064–S077 checkpoints remain `committed_pending_review`; none is
self-accepted. S078 stays gated on independent Codex acceptance of the completed
RCLD-04 boundary. Historical provenance in the earlier repair and Q1/Q2 records
is kept.
