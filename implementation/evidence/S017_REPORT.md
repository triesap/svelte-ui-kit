# S017 step report — Define typed item targets and public exports

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S017","kind":"report","commit":"1fb85b7f80fcde988d494c1446e2487ed40e6899","disposition":"candidate"}
-->

Step ID and title: S017 — Define typed item targets and public exports.

Contract/requirement IDs: R06, R07, R08, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/ARCHITECTURE.md`,
`specs/DATA_MODEL.md`, `specs/GENERATED_LAYOUT.md`, `specs/STYLING.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.
This commit also records the bookkeeping that moves S016 to
`committed_pending_review`.

## Scope implemented

- `schema/v1/registry-item.schema.json` freezes item identity/kind/version,
  description, compatibility, explicit file records (`source`, `target`, `kind`,
  `cohort`), export records (`name`, `target`, `kind`) and managed style records
  (`source`, `target`, `blockId`, `cohort`).
- `src/registry/item.ts` validates the manifest: safe logical targets, file-kind
  extension agreement, unique targets/exports/block IDs, PascalCase export
  names, export targets that reference a declared file, and the shape rules for
  simple (`${id}.svelte` + optional `${id}.types.ts`), compound (`${id}/` with
  `${id}/index.ts`) and CSS-only foundation items.
- No filename or symbol is inferred from an item ID; a CSS-only foundation
  cannot invent a source file or export.

## Files changed or added

| Path                                                                          | Change   | Purpose                         |
| ----------------------------------------------------------------------------- | -------- | ------------------------------- |
| `schema/v1/registry-item.schema.json`                                         | new      | Strict item-manifest schema.    |
| `src/registry/item.ts`                                                        | new      | Typed item model + shape rules. |
| `tests/unit/item-targets.test.ts`                                             | new      | S017 direct tests.              |
| `implementation/COMMIT_SEQUENCE.md`, `implementation/evidence/S016_REPORT.md` | modified | Record S016 pending review.     |

## Verification

| Check                 | Command                                                 | Exit | Result          |
| --------------------- | ------------------------------------------------------- | ---- | --------------- |
| Direct lane           | `pnpm run test:unit -- tests/unit/item-targets.test.ts` | 0    | 7 tests, 7 pass |
| Typecheck (4 configs) | `pnpm run typecheck`                                    | 0    | exit 0          |
| Format / lint         | `pnpm run format:check`, `pnpm run lint`                | 0    | clean           |
| Contract validation   | `pnpm run check:contracts`                              | 0    | 0/0             |
| Whitespace            | `git diff --check`                                      | 0    | no diagnostics  |

## Self-review findings

- Simple, compound and CSS-only sample items validate; wrong file kinds,
  duplicate exports, malformed targets, missing compound index, unknown export
  targets and duplicate block IDs all fail with typed codes.
- Cross-item ownership/export collisions are intentionally deferred to S032.

## Limitations

- Accessibility, registry/npm dependency metadata are S018; asset loading is
  S025–S027. Pending independent Codex review.

## RCLD-02 review-1 repair note

Independent review 1 of the committed S013-S032 candidate requested changes
under the seven RCLD02-R1 closure groups. The original implementation evidence
and commit hash above are retained as provenance; they are not acceptance. The
repaired candidate is committed as green local checkpoints and verified fresh in
`implementation/evidence/RCLD-02_QUALIFICATION.md`. This checkpoint remains
`committed_pending_review`; no acceptance counter or accepted hash changes.
