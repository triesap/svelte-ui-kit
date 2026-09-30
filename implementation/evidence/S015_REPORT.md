# S015 step report — Model explicit requested item sets

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S015","kind":"report","commit":"7a4d122c1f92d1f6db7e6c10e0a70fad89c752b9","disposition":"candidate"}
-->

Step ID and title: S015 — Model explicit requested item sets.

Contract/requirement IDs: R11, R26, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/COMPONENT_CATALOG.md`,
`specs/DATA_MODEL.md`, `specs/SYNCHRONIZATION.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.
This commit also records the bookkeeping that moves S014 to
`committed_pending_review`.

## Scope implemented

- `src/project/requests.ts` owns the explicit requested set independently of any
  dependency closure. IDs must be lowercase kebab-case; normalization
  de-duplicates and sorts by UTF-16 code unit, so it is deterministic and
  idempotent. `addRequest` never adds a dependency, and `transitiveRequests`
  exposes closure-only items without promoting them to explicit requests.
- The `kit.schema.json` `requested` array already constrains entries to the
  same kebab-case pattern and unique items; no schema spelling changed.

## Files changed or added

| Path                                                                          | Change   | Purpose                               |
| ----------------------------------------------------------------------------- | -------- | ------------------------------------- |
| `src/project/requests.ts`                                                     | new      | Explicit request model/normalization. |
| `tests/unit/requests.test.ts`                                                 | new      | S015 direct tests.                    |
| `implementation/COMMIT_SEQUENCE.md`, `implementation/evidence/S014_REPORT.md` | modified | Record S014 pending review.           |

## Verification

| Check                 | Command                                             | Exit | Result          |
| --------------------- | --------------------------------------------------- | ---- | --------------- |
| Direct lane           | `pnpm run test:unit -- tests/unit/requests.test.ts` | 0    | 5 tests, 5 pass |
| Regression            | `pnpm run test:unit -- tests/unit/config.test.ts`   | 0    | 9 tests, 9 pass |
| Typecheck (4 configs) | `pnpm run typecheck`                                | 0    | exit 0          |
| Format                | `pnpm run format:check`                             | 0    | formatted       |
| Lint                  | `pnpm run lint`                                     | 0    | no findings     |
| Contract validation   | `pnpm run check:contracts`                          | 0    | 0/0             |
| Whitespace            | `git diff --check`                                  | 0    | no diagnostics  |

## Self-review findings

- `button` alone stays the only explicit request even when the resolved closure
  contains `spinner`/`tokens`; explicit `spinner` + `button` is distinguishable
  from a transitive `spinner`.
- Invalid names, duplicates and non-strings fail with `REQUEST_ID_INVALID` and
  the logical `requested` locator; normalization is idempotent.

## Limitations

- The registry/resolver that produces the closure does not exist yet; S015 only
  models and normalizes the explicit set. Pending independent Codex review.

## RCLD-02 review-1 repair note

Independent review 1 of the committed S013-S032 candidate requested changes
under the seven RCLD02-R1 closure groups. The original implementation evidence
and commit hash above are retained as provenance; they are not acceptance. The
repaired candidate is committed as green local checkpoints and verified fresh in
`implementation/evidence/RCLD-02_QUALIFICATION.md`. This checkpoint remains
`committed_pending_review`; no acceptance counter or accepted hash changes.
