# S029 step report — Make closure and export order deterministic

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S029","kind":"report","commit":"3720ea8702e96c293feec91950313623f8e1b6ba","disposition":"candidate"}
-->

Step ID and title: S029 — Make closure and export order deterministic.

Contract/requirement IDs: R06, R07, R11, R15, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/DATA_MODEL.md`,
`specs/GENERATED_LAYOUT.md`, `specs/SECURITY_AND_TRANSACTIONS.md`,
`specs/STYLING.md`, `specs/SYNCHRONIZATION.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.
This commit also records the bookkeeping that moves S028 to
`committed_pending_review`.

## Scope implemented

- `src/registry/order.ts` provides the documented, code-unit tie-broken
  ordering helpers: `orderedUnique`, `orderDependencies`, `orderExports` (by
  public name/target/kind), and `orderCssBlocks` (token block first, then block
  id/target/cohort) plus a byte-stable projection helper.
- `src/registry/resolve.ts` now uses the shared ordering helpers for roots,
  dependencies and the sorted closure member list.
- Ordering applies only to registry _metadata_ arrays; application-owned text is
  never rewritten, so formatting is preserved.

## Files changed or added

| Path                                                                          | Change   | Purpose                          |
| ----------------------------------------------------------------------------- | -------- | -------------------------------- |
| `src/registry/order.ts`                                                       | new      | Deterministic ordering helpers.  |
| `src/registry/resolve.ts`                                                     | modified | Use the shared ordering helpers. |
| `tests/unit/resolve-order.test.ts`                                            | new      | S029 direct tests.               |
| `implementation/COMMIT_SEQUENCE.md`, `implementation/evidence/S028_REPORT.md` | modified | Record S028 pending review.      |

## Verification

| Check         | Command                                                   | Exit | Result          |
| ------------- | --------------------------------------------------------- | ---- | --------------- |
| Direct lane   | `pnpm run test:unit -- tests/unit/resolve-order.test.ts`  | 0    | 5 tests, 5 pass |
| Registry lane | `pnpm run test:registry -- tests/registry/health.test.ts` | 0    | 4 tests, 4 pass |
| Typecheck     | `pnpm run typecheck`                                      | 0    | exit 0          |
| Format / lint | `pnpm run format:check`, `pnpm run lint`                  | 0    | clean           |
| Contracts     | `pnpm run check:contracts`                                | 0    | 0/0             |

## Self-review findings

- Permuted roots/manifests produce the same closure and order; repeated
  projections are byte-identical.
- Tokens precede dependent styles; export order is name/target/kind stable.

## Limitations

- Requested/transitive provenance is S030; range reconciliation is S031.
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
