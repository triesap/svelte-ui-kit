# S019 step report — Define source-file ownership lock records

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S019","kind":"report","commit":"58ee9b84c9ee99c225e69e386c477ea344308d61","disposition":"candidate"}
-->

Step ID and title: S019 — Define source-file ownership lock records.

Contract/requirement IDs: R11, R12, R13, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/DATA_MODEL.md`,
`specs/SYNCHRONIZATION.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.
This commit also records the bookkeeping that moves S018 to
`committed_pending_review`.

## Scope implemented

- `schema/v1/kit-lock.schema.json` freezes the lock top-level fields
  (`schemaVersion`, `toolVersion`, `registryVersion`, `registryHash`,
  `configHash`, `requested`, `items`, `files`) with explicit item records
  (`id`, `version`, `digest`, `origin`) and file records (`path`, `owner`,
  `baseHash`, `itemVersion`, `cohort`).
- `src/codegen/lock.ts` validates the lock: unique file ownership, known owners,
  safe logical paths, strict item versions, sorted requested roots exactly equal
  to the explicitly-originated items, and `additionalProperties: false` so a
  redundant reverse index cannot be stored. `ownerIndex` is derived from the
  canonical records rather than trusted independently.
- `preserveBaseOnCustomized` keeps the legitimate upstream base untouched and
  does not accept incoming content or versions; `adoptBaseOnClean` advances the
  base only for a clean target.

## Files changed or added

| Path                                                                          | Change   | Purpose                     |
| ----------------------------------------------------------------------------- | -------- | --------------------------- |
| `schema/v1/kit-lock.schema.json`                                              | new      | Strict lock schema.         |
| `src/codegen/lock.ts`                                                         | new      | Ownership/lineage model.    |
| `tests/unit/lock-files.test.ts`                                               | new      | S019 direct tests.          |
| `implementation/COMMIT_SEQUENCE.md`, `implementation/evidence/S018_REPORT.md` | modified | Record S018 pending review. |

## Verification

| Check                 | Command                                               | Exit | Result          |
| --------------------- | ----------------------------------------------------- | ---- | --------------- |
| Direct lane           | `pnpm run test:unit -- tests/unit/lock-files.test.ts` | 0    | 7 tests, 7 pass |
| Typecheck (4 configs) | `pnpm run typecheck`                                  | 0    | exit 0          |
| Format / lint         | `pnpm run format:check`, `pnpm run lint`              | 0    | clean           |
| Contract validation   | `pnpm run check:contracts`                            | 0    | 0/0             |
| Whitespace            | `git diff --check`                                    | 0    | no diagnostics  |

## Self-review findings

- Duplicate ownership, unknown owners, stored reverse indexes, malformed hashes,
  invalid versions/paths and requested/origin disagreement fail with typed
  codes or `SCHEMA_INVALID`.
- A preserved customized base retains its recorded hash and effective version;
  it never inherits incoming metadata.

## Limitations

- CSS-block and integration lock records are S020; the ownership comparison
  matrix and plan application are later sequences. Pending Codex review.

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
