# S028 step report — Resolve dependencies with cycle and missing-item diagnostics

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S028","kind":"report","commit":null,"disposition":"candidate"}
-->

Step ID and title: S028 — Resolve dependencies with cycle and missing-item
diagnostics.

Contract/requirement IDs: R08, R11, R15, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/ARCHITECTURE.md`,
`specs/DATA_MODEL.md`, `specs/SECURITY_AND_TRANSACTIONS.md`,
`specs/SYNCHRONIZATION.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.
This commit also records the bookkeeping that moves S027 to
`committed_pending_review`.

## Scope implemented

- `src/registry/resolve.ts` traverses the validated snapshot graph from the
  explicit roots and returns a deterministic dependency-before-dependent
  closure. A diamond dependency is visited once; empty roots resolve safely.
- Cycles report the concrete path (`a -> b -> c -> a`); unknown roots or
  dependencies report `RESOLVE_MISSING_ITEM` with the item locator. Every
  diagnostic names the registry identity (version + content hash).
- Resolution is pure and read-only: no writes while resolving.

## Files changed or added

| Path                                                                          | Change   | Purpose                     |
| ----------------------------------------------------------------------------- | -------- | --------------------------- |
| `src/registry/resolve.ts`                                                     | new      | Closure/cycle resolution.   |
| `tests/unit/resolve-errors.test.ts`                                           | new      | S028 direct tests.          |
| `implementation/COMMIT_SEQUENCE.md`, `implementation/evidence/S027_REPORT.md` | modified | Record S027 pending review. |

## Verification

| Check                 | Command                                                   | Exit | Result          |
| --------------------- | --------------------------------------------------------- | ---- | --------------- |
| Direct lane           | `pnpm run test:unit -- tests/unit/resolve-errors.test.ts` | 0    | 7 tests, 7 pass |
| Typecheck (5 configs) | `pnpm run typecheck`                                      | 0    | exit 0          |
| Format / lint         | `pnpm run format:check`, `pnpm run lint`                  | 0    | clean           |
| Contract validation   | `pnpm run check:contracts`                                | 0    | 0/0             |

## Self-review findings

- Self-cycles, multi-node cycles, missing roots and missing dependencies all
  fail deterministically; a diamond resolves once.
- Ordering already follows dependency-before-dependent with code-unit tie
  breaking; S029 extracts and hardens the ordering contract.

## Limitations

- Ordering extraction/permutation tests are S029; range reconciliation is
  S031. Pending independent Codex review.
