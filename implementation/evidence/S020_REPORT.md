# S020 step report — Add CSS-block and integration lock records

Current disposition: independently accepted by Codex on 2026-09-30 at combined evidence anchor `0e5b1852d02e15159f2ee4dd885152230457e119`. Original implementation `b9cb6cc47313bb23614014f6562140ae89a42932` remains provenance. Historical candidate/pending statements below are superseded by this acceptance; later requirements and release AC20 remain open.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S020","kind":"report","commit":"0e5b1852d02e15159f2ee4dd885152230457e119","disposition":"implemented"}
-->

Step ID and title: S020 — Add CSS-block and integration lock records.

Contract/requirement IDs: R07, R13, R14, R17, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/GENERATED_LAYOUT.md`,
`specs/STYLING.md`, `specs/SYNCHRONIZATION.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.
This commit also records the bookkeeping that moves S019 to
`committed_pending_review`.

## Scope implemented

- `schema/v1/kit-lock.schema.json` gains required `cssBlocks` (per-block
  `path`/`owner`/`blockId`/`baseHash`/`itemVersion`/`cohort`) and `integrations`
  (`kind` ∈ layout/stylesheet/exports, `path`, `baseline` digest, `contract`
  identity) records.
- `src/codegen/lock.ts` validates unique block IDs across the lock, known
  owners, safe `.css` paths, unique integration `kind:path` pairs and safe
  integration paths. A per-target lineage check rejects an `itemVersion` newer
  than its owning item's recorded version, so source/style metadata cannot
  contradict the stored baseline. `blocksOwnedBy`/`integrationsOfKind` derive
  deterministic views from the canonical records.
- Several blocks in one `kit.css` with different owners stay distinguishable.

## Files changed or added

| Path                                                                          | Change   | Purpose                         |
| ----------------------------------------------------------------------------- | -------- | ------------------------------- |
| `schema/v1/kit-lock.schema.json`                                              | modified | CSS-block/integration records.  |
| `src/codegen/lock.ts`                                                         | modified | Block/integration validation.   |
| `tests/unit/lock-styles.test.ts`                                              | new      | S020 direct tests.              |
| `tests/unit/lock-files.test.ts`                                               | modified | Supply the new required arrays. |
| `implementation/COMMIT_SEQUENCE.md`, `implementation/evidence/S019_REPORT.md` | modified | Record S019 pending review.     |

## Verification

| Check                 | Command                                                | Exit | Result          |
| --------------------- | ------------------------------------------------------ | ---- | --------------- |
| Direct lane           | `pnpm run test:unit -- tests/unit/lock-styles.test.ts` | 0    | 5 tests, 5 pass |
| Regression            | `pnpm run test:unit -- tests/unit/lock-files.test.ts`  | 0    | 7 tests, 7 pass |
| Typecheck (4 configs) | `pnpm run typecheck`                                   | 0    | exit 0          |
| Format / lint         | `pnpm run format:check`, `pnpm run lint`               | 0    | clean           |
| Contract validation   | `pnpm run check:contracts`                             | 0    | 0/0             |
| Whitespace            | `git diff --check`                                     | 0    | no diagnostics  |

## Self-review findings

- Multiple owners in one stylesheet, duplicate block IDs, forged block indexes,
  unknown owners, unsafe paths and contradictory lineage all fail
  deterministically.
- Integration `kind:path` uniqueness prevents double-claiming a layout import.

## Limitations

- Applying the lock in a transaction and the ownership comparison matrix belong
  to later sequences. Pending independent Codex review.

## RCLD-02 review-1 repair note

Independent review 1 of the committed S013-S032 candidate requested changes
under the seven RCLD02-R1 closure groups. The original implementation evidence
and commit hash above are retained as provenance; they are not acceptance. The
repaired candidate is committed as green local checkpoints and verified fresh in
`implementation/evidence/RCLD-02_QUALIFICATION.md`. This checkpoint remains
`committed_pending_review`; no acceptance counter or accepted hash changes.

## RCLD-02 review-2 repair note

Independent review 2 of the committed S013-S032 candidate requested changes
under the four RCLD02-R2 groups. The original implementation evidence and commit
hash above are retained as provenance; they are not acceptance. The repaired
candidate is committed as green local checkpoints and verified fresh in
`implementation/evidence/RCLD-02_QUALIFICATION.md`. This checkpoint remains
`committed_pending_review`; no acceptance counter or accepted hash changes.

## RCLD-02 review-3 repair note

Independent review 3 of the committed S013-S032 candidate requested changes
under the three RCLD02-R3 groups. The original implementation evidence and
commit hash above are retained as provenance; they are not acceptance. The
repaired candidate is committed as green local checkpoints and verified fresh in
`implementation/evidence/RCLD-02_QUALIFICATION.md`. This checkpoint remains
`committed_pending_review`; no acceptance counter or accepted hash changes.

## RCLD-02 review-4 repair note

Independent review 4 of the committed S013-S032 candidate requested both
RCLD02-R4 groups. The original implementation hash above and the review-1/2/3
repair notes remain provenance; they are not acceptance.

R4-1 no longer describes per-category file/block/integration checks as complete
ownership validation. `parseKitLock` now compares one normalized claim inventory
across all roles: aliases always fail, strict ancestry always fails in either
order, block/block and compatible block/stylesheet aggregate sharing remain
valid, every other exact-path collision fails, and no file claim may equal or be
an ancestor of a required UI/styles/state directory. The maintained matrix is
`tests/unit/lock-ownership.test.ts`; the emitted-copy positive/negative control
is in `tests/integration/installed-package.test.ts`.

This checkpoint remains `committed_pending_review`; no acceptance counter or
accepted hash changes.
