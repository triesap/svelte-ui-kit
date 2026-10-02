# RCLD-04 review-10 repair evidence

Status: implementation repairs complete and locally verified; S064–S077 remain
`committed_pending_review`. Independent Codex acceptance is required before
S078. This is Pi-authored implementation evidence, not an acceptance decision.

Original S064–S077 definitions, R01–R34, AC01–AC22 and the accepted
RCLD-01..RCLD-03 records are unchanged. The fourteen checkpoint reports keep
their original implementation hashes as provenance; this file records the
review-10 repairs and their causal regressions.

## Findings and repairs (review 10, RCLD04-R1-1..R1-5)

### RCLD04-R1-1 — complete immutable apply authority and physical read set

- `src/codegen/authority.ts` (new) carries the physical read set: the root
  device/inode identity, the observed non-final ancestor chain (existing
  directories with identities, or approved absence) and the relevant
  config/manifest/mapping/lock evidence bytes. `captureReadset` builds it from a
  live root.
- `validateApplyPlan` now requires the read set, rejects unknown operations,
  rejects the canonical lock posed as an ordinary target, rejects targets that
  overlap the reserved transient namespace, validates create/update/retire
  preimage kinds and digests, copies and seals result bytes and binds each
  result digest. Mutating the caller's plan after validation, or mutating the
  sealed byte arrays in place, no longer confers authority.
- `applyPlan` verifies the sealed digests, guards the transient namespace
  ancestry before the first write, and re-proves the root/ancestor identities
  and evidence bytes under coordination. A replaced root or ancestor with equal
  target bytes is refused. Absent ancestors are legitimate for fresh
  initialization and custom mappings; they are created as owned state and
  cleaned when empty.
- `revalidatePreimages` accepts the physical read set and skips the lexical
  absent-ancestor refusal when the plan has already recorded and verified the
  chain.

### RCLD04-R1-2 — coordinated recovery and preserved intervening edits

- `applyPlan` acquires the exclusive writer lock **before** recovery and holds
  it across recovery, revalidation, staging, replacement, publication and
  cleanup. A contender receives `WRITER_BUSY` and never recovers a live owner.
- The affected preimages and read set are re-proved after staging and before
  live replacement, so an edit made during staging is refused rather than
  overwritten.
- Unknown/ambiguous stale ownership continues to fail closed; no takeover is
  inferred from PID, age, equal bytes or a `finally` handler.

### RCLD04-R1-3 — durable publication and truthful partial failures

- `publishLock` persists a durable publication **intent** (phase `applied`, a
  lock record with `published:false` and the intended digest) before the
  canonical rename, then persists the published record. Recovery classifies an
  `applied` journal with an intent by comparing the canonical bytes: a matching
  digest is a completed commit (cleanup only, no rollback); a non-matching
  digest rolls back.
- The existing canonical lock mode is preserved across publication.
- Transaction setup, journal persistence, replacement, publication and cleanup
  failures return typed outcomes; a setup failure cleans only its owned
  directory and leaves no journal-less orphan. Leftover temporary journals are
  cleaned when the durable journal was never renamed and no live mutation was
  recorded.

### RCLD04-R1-4 — whole-journal recovery preflight and owned cleanup

- `recoverTransaction`/`recoverTransactions` now require the approved mapping
  from the caller (the guarded apply boundary supplies it) and run the existing
  `validateJournalTargets` before any effect. A schema-valid forged journal
  naming a target outside the approved roots is refused.
- Rollback preflights **every** operation before restoring any of them:
  non-following ancestry, current image, recorded preimage and an owned backup
  whose bytes must match the recorded preimage. A corrupt or missing backup, an
  unsafe ancestor symlink or a post-interruption user edit refuses without
  partial restoration and without leaking absolute paths.
- Cleanup removes only proven owned entries (`journal.json`, `staged`,
  `backups`, `progress`). An unexpected entry blocks cleanup and is retained.
- A crash before the prepared journal rename (no `journal.json`, only owned
  transient state) is cleaned; a present-but-corrupt journal is refused.

### RCLD04-R1-5 — real composed plans, processes and application artifacts

- `src/codegen/compose.ts` (new) links the pure planners to the guarded
  boundary: it separates the canonical lock as final publication, verifies each
  write's declared operation against the observed filesystem, captures
  preimages and the physical read set, and binds a deterministic plan digest.
- `tests/integration/transaction-authority.test.ts` covers unknown operations,
  the canonical-lock target, seal/mutation resistance, in-place byte mutation,
  replaced root/ancestor identities, changed evidence, metadata-only evidence
  and transient symlink isolation.
- `tests/integration/transaction-safety.test.ts` covers contender coordination,
  staging-time edits, the publication gap, typed setup failure, lock-mode
  preservation, forged recovery targets, corrupt backups, ancestor-symlink
  recovery, unexpected-entry retention, complete-tree comparison, the
  same-filesystem constraint, real SIGKILL at journal/backup/replace/
  progress/lock/cleanup boundaries, and a real two-writer hold/contend case.
- `tests/integration/guarded-composition.test.ts` runs the real `planInit`
  (bundled registry) and `planAdd`/`planSync` (validator-loaded registry), feeds
  the writes through the production `composeApplyPlan`, applies them with the
  production `validateApplyPlan`/`applyPlan`, then checks, builds and
  server-renders the generated consumer.

## Verification (this candidate)

Repository-owned commands; raw logs are retained under the ignored local
evidence log directory for this candidate. `format:check`, `lint`, `typecheck`,
`build`, unit and integration suites pass; the remaining cumulative lanes and
their exact counts are recorded in the final candidate log inventory.

## Limitations

- Trusted-local threat model only; no hostile concurrent-filesystem race
  protection is claimed.
- Windows and non-local filesystems remain unqualified; the supported
  same-filesystem/durability assumption is verified by same-device checks on
  the executed platform.
- Release AC20's fixture-only upstream Bits TS2590 declaration exception remains
  open debt; no new suppression was added.
- S077 remains pending independent acceptance; S078 is out of scope.
