# RCLD-04 review-13 repair evidence

Status: partial implementation repair for independent review 13 is locally
verified. S064–S077 remain `committed_pending_review`; independent Codex
acceptance is required before S078. This is Pi-authored implementation evidence,
not an acceptance decision. It supersedes the specific review-12 claims that the
review-13 findings below contradict; `RCLD04_R2_REPAIR.md` remains the historical
record of the earlier pass.

Original S064–S077 definitions, R01–R34, AC01–AC22, the accepted RCLD-01..RCLD-03
records and the accepted pure planner behavior are unchanged.

## Repaired review-13 findings

### Installed resolution authority (RCLD04-R2-1)

`captureEnvironment` now records the physical integrity of each resolved
installed `package.json` (nearest `node_modules`, then ancestors) alongside the
selected manifest and package-manager lockfiles, including an explicit absence
only where the manifest/lockfile genuinely did not exist. `composeApplyPlan`
carries that captured evidence into the guarded apply read set, so a
post-planning installed metadata change is refused as `AUTHORITY_READ_CHANGED`
before any semantic write. Planning still reasons from the captured snapshot;
no live read is mixed into planning, and an out-of-root hoisted layout is
excluded rather than guessed.

### Publication proof (RCLD04-R2-3)

- `verifyPublishedEvidence` now requires the surviving publication witness. A
  missing witness is no longer treated as a cleanup-tail proof; recovery refuses
  and preserves evidence.
- The canonical lock must be the _exact physical image_ recorded as the staged
  publication witness (device/inode), in addition to the recorded bytes, mode,
  transaction id, plan digest and root identity. An equal-byte/equal-mode lock
  at a different inode is a contradiction that refuses cleanup.

### Exact recovery ownership (RCLD04-R2-4)

Temporary-name prefixes are no longer ownership. Inventory verification and
cleanup remove only the two exact recorded temporary names
(`journal.json.tmp-<id>` and `publication.json.tmp-<id>`); an unrelated notes
file that merely resembles a temporary journal is retained and blocks cleanup.

### Journal-less tail root binding (RCLD04-R2-4)

The durable publication witness now records the validated journal root identity
and plan digest. A journal-less (or applied-phase) witness is bound to the live
project root before any cleanup-tail mutation; a witness recorded against a
different or replaced root is refused as `RECOVERY_ROOT_MISMATCH` with its
evidence preserved.

### Cross-directory durability (RCLD04-R2-2)

Both affected parent directories are flushed for every cross-directory rename:
backup move (backups parent and target parent), replacement (target parent and
staged parent), lock publication (canonical parent and staged parent) and
recovery restore (target parent and backups parent). The staged publication
lock's parent is flushed during lock staging, before the durable publication
intent records its physical identity.

## Verification performed

All commands were routed through the extbuild launcher after a green doctor.
Counts are from the retained raw run outputs.

- `pnpm run build` — exit 0
- `pnpm run typecheck` — exit 0
- `pnpm run format:check` — exit 0
- `pnpm run lint` — exit 0
- `pnpm run test:unit` — 276 pass / 0 fail
- `pnpm run test:integration` — 401 pass / 0 fail (includes new causal
  regressions for installed-authority drift, publication-witness inode/missing
  witness, unrecorded temporary-journal ownership, journal-less root binding and
  real `fsync` parent-directory coverage)
- `pnpm run test:registry` — 38 pass / 0 fail
- `pnpm run test:cli-bootstrap` — 52 pass / 0 fail
- `pnpm run test:harness` — 37 pass / 0 fail
- `pnpm run test:components` — 22 pass / 0 fail
- `pnpm run test:contracts` — 137 pass / 0 fail
- `node tools/check-contracts.mjs` — 0 error(s), 0 warning(s)

The prior review-12 compiled probe suites (`probes`, `extra-probes`,
`authority-probes`, `boundary-probes`, `remaining-probes`, `installed-probe`)
were re-run against the repaired build: semantics are unchanged for the 28
previously-safe cases, and the four review-13 cases now produce their safe
outcomes. The actual `fsync` trace was re-captured and shows both parents for
the backup, replacement and publication renames and the staged parent before
the publication intent.

## Remaining RCLD-04 work (not complete, not accepted)

- RCLD04-R2-1: final projected lock/config/ownership/cohort coherence before
  semantic writes.
- RCLD04-R2-2: recorded identities of directories an attempt creates, unrelated
  newly appearing ancestry refusal, empty-only owned-ancestor rollback, captured
  guarded ignore-file integration, and metadata-only/cross-device filesystem
  qualification.
- RCLD04-R2-3: complete staged/preimage witness qualification and both sides of
  each intent/rename/record boundary.
- RCLD04-R2-4: plan/owner/phase/progress/root/ancestry binding before every
  effect and proven exclusive coordination through the actual production
  entrypoints for exported recovery.
- RCLD04-R2-5: the full actual composed lifecycle (custom init/add/sync, update,
  retirement, metadata-only, satisfied, conflicts), coordinated interruption/
  restart processes and platform automation qualification.
- Reconcile every S064–S077 and repair report to final coverage and counts after
  the remaining work lands.

No independent acceptance is claimed for any of the fourteen pending
checkpoints.
