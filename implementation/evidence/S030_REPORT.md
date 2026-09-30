# S030 step report — Project requested versus transitive provenance

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S030","kind":"report","commit":"cb67f7cb6b70e5424b7e51258c631cc119db055e","disposition":"candidate"}
-->

Step ID and title: S030 — Project requested versus transitive provenance.

Contract/requirement IDs: R11, R18, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/DATA_MODEL.md`,
`specs/SYNCHRONIZATION.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.
This commit also records the bookkeeping that moves S029 to
`committed_pending_review`.

## Scope implemented

- `src/registry/projection.ts` projects the explicit roots and the resolved
  closure into one view: each closure member carries `provenance`
  (`explicit`/`transitive`) and the sorted explicit roots that require it.
  `retired` is the previous closure minus the current closure for later
  synchronization; `retained` is the current closure.
- Removing a root never removes an explicitly requested or still-required item;
  a shared dependency remains while any root needs it. The projection is pure
  and never writes the closure back into the requested roots.

## Files changed or added

| Path                                                                          | Change   | Purpose                     |
| ----------------------------------------------------------------------------- | -------- | --------------------------- |
| `src/registry/projection.ts`                                                  | new      | Requested/transitive view.  |
| `tests/unit/request-projection.test.ts`                                       | new      | S030 direct tests.          |
| `implementation/COMMIT_SEQUENCE.md`, `implementation/evidence/S029_REPORT.md` | modified | Record S029 pending review. |

## Verification

| Check         | Command                                                       | Exit | Result          |
| ------------- | ------------------------------------------------------------- | ---- | --------------- |
| Direct lane   | `pnpm run test:unit -- tests/unit/request-projection.test.ts` | 0    | 5 tests, 5 pass |
| Regression    | `pnpm run test:unit -- tests/unit/resolve-order.test.ts`      | 0    | 5 tests, 5 pass |
| Typecheck     | `pnpm run typecheck`                                          | 0    | exit 0          |
| Format / lint | `pnpm run format:check`, `pnpm run lint`                      | 0    | clean           |
| Contracts     | `pnpm run check:contracts`                                    | 0    | 0/0             |

## Self-review findings

- `button` closure includes `spinner`/`tokens` while config roots stay
  `["button"]`; explicit `spinner` is distinguishable from a transitive one.
- Shared dependencies report both requiring roots and survive root removal.

## Limitations

- Range reconciliation is S031; collision validation is S032. Pending
  independent Codex review.

## RCLD-02 review-1 repair note

Independent review 1 of the committed S013-S032 candidate requested changes
under the seven RCLD02-R1 closure groups. The original implementation evidence
and commit hash above are retained as provenance; they are not acceptance. The
repaired candidate is committed as green local checkpoints and verified fresh in
`implementation/evidence/RCLD-02_QUALIFICATION.md`. This checkpoint remains
`committed_pending_review`; no acceptance counter or accepted hash changes.
