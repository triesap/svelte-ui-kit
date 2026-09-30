# S016 step report — Define the registry-root schema

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S016","kind":"report","commit":"ddba4853d36f8eb1980c7caaa71b24ae26b9d30c","disposition":"candidate"}
-->

Step ID and title: S016 — Define the registry-root schema.

Contract/requirement IDs: R08, R12, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/ARCHITECTURE.md`,
`specs/DATA_MODEL.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.
This commit also records the bookkeeping that moves S015 to
`committed_pending_review`.

## Scope implemented

- `schema/v1/registry.schema.json` freezes the root fields (`schemaVersion`,
  `registryVersion`, `contentHash`, `compatibility`, `items`) with explicit
  `{id, manifest}` item records, `additionalProperties: false` and fixed ranges.
- `src/registry/model.ts` validates the root, rejects duplicate IDs/manifest
  paths and unsafe logical manifest paths, validates compatibility ranges and
  verifies the canonical content identity. It also builds the honest empty
  development registry. Host paths/timestamps never enter the identity.
- `registry/registry.json` is the packaged development root: `registryVersion`
  `0.1.0`, empty `items`, and a verified content hash.
- `src/codegen/serialize.ts` and `src/codegen/digest.ts` provide canonical JSON
  and SHA-256 primitives; the registry content identity is their first consumer.
  S024 owns their exhaustive edge-case tests.

## Files changed or added

| Path                                                                          | Change   | Purpose                           |
| ----------------------------------------------------------------------------- | -------- | --------------------------------- |
| `schema/v1/registry.schema.json`                                              | new      | Strict registry-root schema.      |
| `src/registry/model.ts`                                                       | new      | Root model/identity/validation.   |
| `registry/registry.json`                                                      | new      | Honest empty development root.    |
| `src/codegen/serialize.ts`                                                    | new      | Canonical semantic JSON.          |
| `src/codegen/digest.ts`                                                       | new      | Exact-byte and canonical hashing. |
| `tests/unit/registry-root.test.ts`                                            | new      | S016 direct tests.                |
| `implementation/COMMIT_SEQUENCE.md`, `implementation/evidence/S015_REPORT.md` | modified | Record S015 pending review.       |

## Verification

| Check                 | Command                                                  | Exit | Result          |
| --------------------- | -------------------------------------------------------- | ---- | --------------- |
| Direct lane           | `pnpm run test:unit -- tests/unit/registry-root.test.ts` | 0    | 7 tests, 7 pass |
| Typecheck (4 configs) | `pnpm run typecheck`                                     | 0    | exit 0          |
| Format / lint         | `pnpm run format:check`, `pnpm run lint`                 | 0    | clean           |
| Contract validation   | `pnpm run check:contracts`                               | 0    | 0/0             |
| Whitespace            | `git diff --check`                                       | 0    | no diagnostics  |

## Self-review findings

- The development root advertises no item, so no absent component is promised.
- Duplicate IDs, duplicate manifests, traversal paths, non-npm compatibility
  ranges and a tampered `contentHash` all fail before any consumer sees the
  root. The empty identity `4b3b152f…48c6e9` is reproducible from the canonical
  preimage and excludes its own hash.

## Limitations

- No manifest/item schema or asset loading exists yet; item paths are validated
  structurally only. Pending independent Codex review.

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
