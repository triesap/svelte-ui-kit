# S018 step report — Add accessibility and dependency manifest metadata

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S018","kind":"report","commit":"43d59e1f63fb95ce75eb10f6c38eca888a6de361","disposition":"candidate"}
-->

Step ID and title: S018 — Add accessibility and dependency manifest metadata.

Contract/requirement IDs: R03, R10, R22, R30, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/ACCEPTANCE_CRITERIA.md`,
`specs/API_CONTRACTS.md`, `specs/ARCHITECTURE.md`,
`specs/COMPONENT_CATALOG.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.
This commit also records the bookkeeping that moves S017 to
`committed_pending_review`.

## Scope implemented

- `schema/v1/registry-item.schema.json` gains `registryDependencies` (unique
  item IDs), `npmDependencies` (`{name, range, role}` with role restricted to
  `runtime`/`tooling`/`peer`) and `accessibility` (descriptive `requiredNames`,
  `keyboard`, `focus`, `form`, `tests`).
- `src/registry/item.ts` validates these: npm ranges must be registry ranges
  (git/file/url sources are typed errors), duplicate npm names are conflicts,
  and a self registry dependency is rejected. Accessibility metadata is
  descriptive only — never an executable hook or an accessibility claim.
- The fields are optional on the wire and default to empty descriptive
  structures, so every S017 fixture remains valid; a partially specified
  `accessibility` object still fails the schema.

## Files changed or added

| Path                                                                          | Change   | Purpose                          |
| ----------------------------------------------------------------------------- | -------- | -------------------------------- |
| `schema/v1/registry-item.schema.json`                                         | modified | Accessibility/dependency fields. |
| `src/registry/item.ts`                                                        | modified | Typed metadata validation.       |
| `tests/unit/item-metadata.test.ts`                                            | new      | S018 direct tests.               |
| `implementation/COMMIT_SEQUENCE.md`, `implementation/evidence/S017_REPORT.md` | modified | Record S017 pending review.      |

## Verification

| Check                 | Command                                                  | Exit | Result          |
| --------------------- | -------------------------------------------------------- | ---- | --------------- |
| Direct lane           | `pnpm run test:unit -- tests/unit/item-metadata.test.ts` | 0    | 6 tests, 6 pass |
| Regression            | `pnpm run test:unit -- tests/unit/item-targets.test.ts`  | 0    | 7 tests, 7 pass |
| Typecheck (4 configs) | `pnpm run typecheck`                                     | 0    | exit 0          |
| Format / lint         | `pnpm run format:check`, `pnpm run lint`                 | 0    | clean           |
| Contract validation   | `pnpm run check:contracts`                               | 0    | 0/0             |
| Whitespace            | `git diff --check`                                       | 0    | no diagnostics  |

## Self-review findings

- Unknown roles, malformed ranges, duplicate declarations and self-dependencies
  fail with typed codes; peer requirements are retained rather than dropped.
- No metadata is executed; the accessibility record is documentation of
  obligations that later browser lanes must actually test.

## Limitations

- Dependency-graph resolution and joint range reconciliation are S028/S031.
  Pending independent Codex review.

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
RCLD02-R4 groups. The original implementation evidence and commit hash above are
retained as provenance; they are not acceptance. The complete normalized
cross-role ownership repair and the fresh cumulative qualification are recorded
in `implementation/evidence/RCLD-02_QUALIFICATION.md`. This checkpoint remains
`committed_pending_review`; no acceptance counter or accepted hash changes.
