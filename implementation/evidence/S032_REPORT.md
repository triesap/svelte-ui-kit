# S032 step report — Validate cross-item target and public symbol uniqueness

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S032","kind":"report","commit":"14851a26a8c161d9b2ec87bc0633ced533c3e085","disposition":"candidate"}
-->

Step ID and title: S032 — Validate cross-item target and public symbol
uniqueness.

Contract/requirement IDs: R06, R08, R16, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/ARCHITECTURE.md`,
`specs/DATA_MODEL.md`, `specs/GENERATED_LAYOUT.md`,
`specs/SECURITY_AND_TRANSACTIONS.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.
This commit also records the bookkeeping that moves S031 to
`committed_pending_review`.

## Scope implemented

- `src/registry/validate-targets.ts` validates ownership across the resolved
  (advertised) inventory: one owner per UI/style target, one owner per managed
  CSS block id, and one owner per public export name.
- Collisions are detected with ASCII case folding, so a would-be
  case-insensitive filesystem collision is caught on a case-sensitive developer
  machine.
- Unregistered candidate items are outside the resolved inventory and make no
  public collision claim.
- Valid compound exports resolve to explicit declared files.

## Files changed or added

| Path                                                                          | Change   | Purpose                     |
| ----------------------------------------------------------------------------- | -------- | --------------------------- |
| `src/registry/validate-targets.ts`                                            | new      | Cross-item uniqueness.      |
| `tests/registry/targets.test.ts`                                              | new      | S032 direct tests.          |
| `implementation/COMMIT_SEQUENCE.md`, `implementation/evidence/S031_REPORT.md` | modified | Record S031 pending review. |

## Verification

| Check         | Command                                                    | Exit | Result          |
| ------------- | ---------------------------------------------------------- | ---- | --------------- |
| Direct lane   | `pnpm run test:registry -- tests/registry/targets.test.ts` | 0    | 4 tests, 4 pass |
| Regression    | `pnpm run test:registry -- tests/registry/health.test.ts`  | 0    | 4 tests, 4 pass |
| Typecheck     | `pnpm run typecheck`                                       | 0    | exit 0          |
| Format / lint | `pnpm run format:check`, `pnpm run lint`                   | 0    | clean           |
| Contracts     | `pnpm run check:contracts`                                 | 0    | 0/0             |

## Self-review findings

- Two owners of one path/block/export fail; ASCII case-folded collisions fail
  distinctly (`*_CASE`); candidates are excluded from public claims.
- Valid compound exports resolve to explicit files.

## Limitations

- This completes the RCLD-02 models/registry resolution batch. Project
  integration/planning is S033+. The checkpoint is pending independent Codex
  review; S033 is not started.
