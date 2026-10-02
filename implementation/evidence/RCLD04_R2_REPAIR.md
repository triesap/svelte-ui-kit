# RCLD-04 review-11 repair evidence

Status: implementation repairs for independent review 11 are locally verified;
S064–S077 remain `committed_pending_review`. Independent Codex acceptance is
required before S078. This is Pi-authored implementation evidence, not an
acceptance decision.

Original S064–S077 definitions, R01–R34, AC01–AC22 and the accepted
RCLD-01..RCLD-03 records are unchanged. The fourteen checkpoint reports keep
their original implementation hashes as provenance. This file records the
review-11 repairs and their causal regressions. It supersedes the specific
review-10 claims listed under "Reconciled overclaims" below; `RCLD04_R1_REPAIR.md`
remains the historical record of that earlier pass.

## Findings and repairs (review 11, RCLD04-R2-1..R2-5)

### RCLD04-R2-1 — immutable planning authority carried into apply

- `composeApplyPlan` now consumes the original immutable `ProjectSnapshot` and
  derives every target preimage, ancestor identity and evidence file from it,
  never from a later live recapture. A write the snapshot did not observe is a
  typed `COMPOSE_SNAPSHOT_INCOMPLETE` refusal, and omitting the snapshot is
  `COMPOSE_SNAPSHOT_REQUIRED`.
- `validateApplyPlan` authenticates the sealed instance by a module-private
  brand, derives `rootIdentity` from the recorded read-set root and derives the
  complete plan digest from exact result bytes/modes, operations, mapping,
  read evidence and final lock content. A caller-supplied digest is never
  authority. Strict nested lock/preimage shapes are validated and the final
  lock is parsed and validated before any coordination.
- `applyPlan` verifies sealed lock bytes even for metadata-only/no-change plans
  and re-proves the sealed plan digest, so an in-place mutation of a sealed
  array cannot reuse the old authority. Same-filesystem arrangements are proven
  before any semantic effect.

### RCLD04-R2-2 — live and staged physical guards

- `applyReplacements` re-proves the current target against the planned preimage
  immediately before moving it to a backup, so an observable intervening edit
  is refused and preserved. It re-proves each staged image's exact bytes and
  mode immediately before its rename, so a corrupted staged image is refused
  rather than installed.
- `verifySameFilesystem` refuses a target whose nearest existing ancestor does
  not share the project root's device before staging.

### RCLD04-R2-3 — unique publication from a physical rename witness

- `publication-intent.ts` durably records the canonical preimage identity and
  the uniquely identified staged publication image before the canonical rename.
- `publishLock` writes the witness before the rename; recovery and the in-process
  apply path classify the outcome by identity matching, never by byte equality.
  A matching staged identity proves publication; a matching preimage identity
  (or an absent canonical with the staged image still present) proves
  non-publication; anything else is an ambiguity that refuses without rolling
  back source or deleting evidence.

### RCLD04-R2-4 — coordinated recovery and fully proven owned state

- `transaction-inventory.ts` proves the complete transaction inventory at every
  depth with non-following metadata; unexpected entries, symlinks and unreadable
  directories are typed refusals and are retained. Cleanup re-checks the
  inventory immediately before each removal.
- Recovery fails closed on a missing journal with staged/backup evidence
  (`RECOVERY_AMBIGUOUS_JOURNAL`), rejects the canonical lock as an ordinary
  operation, preserves mode-edited current or backup images, and treats an
  unreadable transaction scan as a typed refusal rather than an empty namespace.
- A failed writer-lock release is reported (`WRITER_LOCK_RELEASE_FAILED`) while
  retaining the owner record, and an applied batch with a failed release is
  downgraded to `committed_needs_cleanup` rather than reported `applied`.
- The final applied-journal persist is wrapped in a typed
  `REPLACE_PROGRESS_FAILED` refusal.

### RCLD04-R2-5 — remaining qualification

Causal regressions were added for the R2-1..R2-4 findings
(`compose-authority`, `transaction-authority`, `replacement-guards`,
`publication-witness`, `recovery-ownership`). The independent reviewer's 22
compiled probes (17 failing cases and 5 controls) were re-run against the
repaired build and all now produce their safe outcome. Remaining qualification
work is listed under "Remaining work" below and is not claimed complete.

## Reconciled overclaims

The following review-10 statements in `RCLD04_R1_REPAIR.md` were overstated and
are corrected by this pass:

- "Recovery classifies ... by comparing the canonical bytes" — replaced by the
  physical rename witness; byte equality is no longer commit proof.
- "Cleanup removes only proven owned entries" — previously only top-level names
  were checked; now the whole inventory is checked recursively.
- "a setup failure cleans only its owned directory" — unchanged, but release
  failure is now propagated instead of ignored.
- "Absent ancestors ... are created as owned state" — ancestor creation is still
  accepted for recorded-absent components; recording and rollback of created
  ancestors remains open (see Remaining work).

## Remaining work (not claimed complete)

- Owned absent-directory creation is not yet recorded for bounded rollback; a
  refused batch can leave created application ancestors.
- Recovery does not yet bind the journal `rootIdentity`/`planDigest` to the live
  root for the standalone (non-apply) path; the guarded apply path supplies the
  approved mapping and expected read set.
- Required ignore-file changes are not yet integrated as captured guarded
  operations; the direct-write helper remains.
- Per-file directory durability ordering is limited to the journal and intent
  records; staged-file and lock-publication flush ordering is not fully
  qualified.
- Composed real-registry custom-mapping update/retirement/metadata/conflict
  qualification and browser/CI platform lanes remain unrun.
- AC20's fixture-only upstream declaration exception remains open release debt.
