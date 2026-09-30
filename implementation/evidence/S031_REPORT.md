# S031 step report — Merge compatible dependency requirements

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S031","kind":"report","commit":"07f35d25df24112f8d7fc20ca549a0167ba3f230","disposition":"candidate"}
-->

Step ID and title: S031 — Merge compatible dependency requirements.

Contract/requirement IDs: R10, R12, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/API_CONTRACTS.md`,
`specs/DATA_MODEL.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.
This commit also records the bookkeeping that moves S030 to
`committed_pending_review`.

## Scope implemented

- `src/registry/dependency-plan.ts` groups npm requirements by package name,
  preserves runtime/tooling/peer roles, and computes the _joint_ intersection
  with strict npm SemVer behavior. OR clauses are intersected clause-by-clause,
  so `^1 || ^2`, `^2 || ^3` and `^1 || ^3` are correctly rejected even though
  every pair overlaps.
- Disjoint ranges fail with `DEPENDENCY_RANGE_CONFLICT` naming the involved item
  ids; git/file/url ranges fail with `DEPENDENCY_SOURCE_UNSUPPORTED`.
- The plan reports declared ranges only; exact installed-version discovery and
  package-manager execution remain separate and the CLI never writes manifests.

## Files changed or added

| Path                                                                          | Change   | Purpose                     |
| ----------------------------------------------------------------------------- | -------- | --------------------------- |
| `src/registry/dependency-plan.ts`                                             | new      | Joint npm requirement plan. |
| `tests/unit/dependency-plan.test.ts`                                          | new      | S031 direct tests.          |
| `implementation/COMMIT_SEQUENCE.md`, `implementation/evidence/S030_REPORT.md` | modified | Record S030 pending review. |

## Verification

| Check         | Command                                                    | Exit | Result          |
| ------------- | ---------------------------------------------------------- | ---- | --------------- |
| Direct lane   | `pnpm run test:unit -- tests/unit/dependency-plan.test.ts` | 0    | 6 tests, 6 pass |
| Typecheck     | `pnpm run typecheck`                                       | 0    | exit 0          |
| Format / lint | `pnpm run format:check`, `pnpm run lint`                   | 0    | clean           |
| Contracts     | `pnpm run check:contracts`                                 | 0    | 0/0             |

## Self-review findings

- Compatible duplicates coalesce; roles and requiring items are retained; peer
  requirements survive even when the module is not directly imported.
- Zero-major and prerelease ranges follow strict npm semantics.

## Limitations

- Cross-item collision validation is S032; no installation occurs. Pending
  independent Codex review.

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
