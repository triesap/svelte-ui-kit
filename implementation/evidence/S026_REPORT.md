# S026 step report — Build an immutable validated registry snapshot

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S026","kind":"report","commit":"466c6ea35b0997dcf57de479adc9d914e1d67bea","disposition":"candidate"}
-->

Step ID and title: S026 — Build an immutable validated registry snapshot.

Contract/requirement IDs: R08, R15, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/ARCHITECTURE.md`,
`specs/DATA_MODEL.md`, `specs/SECURITY_AND_TRANSACTIONS.md`,
`specs/SYNCHRONIZATION.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.
This commit also records the bookkeeping that moves S025 to
`committed_pending_review`.

## Scope implemented

- `src/registry/load.ts` reads the registry root, every advertised manifest and
  every referenced source/style asset through one `AssetProvider`, validates
  manifest identity, computes the asset digest list, verifies the root content
  identity and returns a frozen snapshot with copied bytes.
- Missing assets are surfaced as typed errors; a missing manifest and a missing
  source are both reported. A manifest whose `id` disagrees with the root is
  `REGISTRY_MANIFEST_ID_MISMATCH`; invalid JSON is `REGISTRY_MANIFEST_INVALID`;
  a tampered root hash is `REGISTRY_HASH_MISMATCH`.

## Files changed or added

| Path                                                                          | Change   | Purpose                     |
| ----------------------------------------------------------------------------- | -------- | --------------------------- |
| `src/registry/load.ts`                                                        | new      | Immutable snapshot loader.  |
| `tests/unit/registry-snapshot.test.ts`                                        | new      | S026 direct tests.          |
| `implementation/COMMIT_SEQUENCE.md`, `implementation/evidence/S025_REPORT.md` | modified | Record S025 pending review. |

## Verification

| Check                 | Command                                                      | Exit | Result          |
| --------------------- | ------------------------------------------------------------ | ---- | --------------- |
| Direct lane           | `pnpm run test:unit -- tests/unit/registry-snapshot.test.ts` | 0    | 7 tests, 7 pass |
| Typecheck (4 configs) | `pnpm run typecheck`                                         | 0    | exit 0          |
| Format / lint         | `pnpm run format:check`, `pnpm run lint`                     | 0    | clean           |
| Contract validation   | `pnpm run check:contracts`                                   | 0    | 0/0             |

## Self-review findings

- A snapshot holds copied bytes; mutating the provider's files afterwards does
  not change the resolved bytes or digests.
- All identity/hash/missing-asset failures are deterministic and typed before
  any planner runs.

## Limitations

- The qualification inventory/health lane is S027; dependency resolution is
  S028. Pending independent Codex review.

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
