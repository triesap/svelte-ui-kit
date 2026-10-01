# S061 step report — Project truthful final lock lineage

Current disposition: implementation candidate committed pending independent
Codex review under the RCLD-03 batch. This report is Pi-authored evidence; Codex
alone accepts.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S061","kind":"report","commit":null,"disposition":"candidate"}
-->

Step ID and title: S061 — Project truthful final lock lineage.

Contract/requirement IDs: R12, R13, R14, R15, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/DATA_MODEL.md`,
`specs/SECURITY_AND_TRANSACTIONS.md`, `specs/SYNCHRONIZATION.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `src/codegen/lock-projection.ts` builds the final lock from effective target
  dispositions. A preserved customization keeps its prior base; only a
  create/update adopts the candidate base and item version; a retired owner's
  records are detached; a content-free transition is reported as `metadataOnly`.
- `src/codegen/plan-add.ts` now uses the shared `buildLockProjection` instead of
  its local projection, so add and sync (which delegates to add) share one
  truthful lineage projection.
- `src/codegen/plan-init.ts` preserves the recorded `requested`/`items`/`files`/
  `cssBlocks` collections instead of resetting them, so initialization cannot
  erase installed/customized lineage.

## Files touched

- `src/codegen/lock-projection.ts` — new module.
- `src/codegen/plan-add.ts` — use the shared projection.
- `src/codegen/plan-init.ts` — preserve recorded lock collections.
- `tests/integration/lock-projection.test.ts` — new integration suite.

## Verification

- `pnpm run test:integration -- tests/integration/lock-projection.test.ts` — exit
  0, 4/4 (preserved base, adopted lineage, metadata-only, retired detach).
- `pnpm run test:integration -- tests/integration/plan-add.test.ts
tests/integration/plan-sync.test.ts tests/integration/plan-init.test.ts` — exit 0.
- `pnpm run test:unit -- tests/unit/cohorts.test.ts` — exit 0.
- `pnpm run format:check`, `pnpm run lint`, `pnpm run typecheck` — exit 0.
- `pnpm run check:contracts` — exit 0, 0 errors / 0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Configuration-driven CSS retirement lineage is finalized at S062; the purity
  qualification at S063.
