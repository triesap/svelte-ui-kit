# S024 step report — Implement exact-byte hashing and deterministic serialization

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S024","kind":"report","commit":"00faf8b4feb863da211136f925e357031c14494c","disposition":"candidate"}
-->

Step ID and title: S024 — Implement exact-byte hashing and deterministic
serialization.

Contract/requirement IDs: R12, R13, R15, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/DATA_MODEL.md`,
`specs/SECURITY_AND_TRANSACTIONS.md`, `specs/SYNCHRONIZATION.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.
This commit also records the bookkeeping that moves S023 to
`committed_pending_review`.

## Scope implemented

- `src/codegen/digest.ts` (`sha256Hex`, `canonicalContentHash`) and
  `src/codegen/serialize.ts` (`canonicalJson`) were introduced at S016 for the
  registry identity and are now fully exercised. Exact-byte hashing is lowercase
  64-hex and distinguishes CRLF from LF; semantic hashing is canonical JSON with
  sorted keys, two-space indentation and one LF.
- `tests/unit/digest.test.ts` and `tests/unit/serialize.test.ts` cover known
  SHA-256 vectors, UTF-8/raw bytes, CRLF/LF distinction, key-order
  independence, array-order preservation, escaping, and rejection of
  non-finite/non-JSON values. No timestamps or random identifiers can enter
  semantic output.

## Files changed or added

| Path                                                                          | Change   | Purpose                        |
| ----------------------------------------------------------------------------- | -------- | ------------------------------ |
| `tests/unit/digest.test.ts`                                                   | new      | Exact/semantic hash tests.     |
| `tests/unit/serialize.test.ts`                                                | new      | Canonical serialization tests. |
| `implementation/COMMIT_SEQUENCE.md`, `implementation/evidence/S023_REPORT.md` | modified | Record S023 pending review.    |

## Verification

| Check                 | Command                                              | Exit | Result          |
| --------------------- | ---------------------------------------------------- | ---- | --------------- |
| Direct lane           | `pnpm run test:unit -- tests/unit/digest.test.ts`    | 0    | 6 tests, 6 pass |
| Direct lane           | `pnpm run test:unit -- tests/unit/serialize.test.ts` | 0    | 8 tests, 8 pass |
| Typecheck (4 configs) | `pnpm run typecheck`                                 | 0    | exit 0          |
| Format / lint         | `pnpm run format:check`, `pnpm run lint`             | 0    | clean           |
| Contract validation   | `pnpm run check:contracts`                           | 0    | 0/0             |

## Self-review findings

- Byte and semantic hashes are named and tested distinctly; a current local
  byte sequence can never be normalized into the semantic identity.
- Canonical output is stable across key insertion order and repeated calls.

## Limitations

- Preimage/current-local observations and plan digests are applied by later
  sequences. Pending independent Codex review.

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
