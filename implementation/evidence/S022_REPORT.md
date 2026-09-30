# S022 step report — Freeze CLI envelopes and exit outcomes

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S022","kind":"report","commit":"0e399f17b1e7bb913a5e84ea93a5e9600cff338a","disposition":"candidate"}
-->

Step ID and title: S022 — Freeze CLI envelopes and exit outcomes.

Contract/requirement IDs: R09, R15, R30, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/API_CONTRACTS.md`,
`specs/SECURITY_AND_TRANSACTIONS.md`, `specs/SYNCHRONIZATION.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.
This commit also records the bookkeeping that moves S021 to
`committed_pending_review`.

## Scope implemented

- `schema/v1/command-envelope.schema.json` freezes the single envelope
  (`schemaVersion`, `command`, `status`, `diagnostics`, `changes`, `data`), the
  status vocabulary, diagnostic fields and change records.
- `src/cli/protocol.ts` freezes the exit map (0 success/planned/no_change/
  non-strict-warning, 1 error, 2 usage/unsupported, 3 strict doctor, 10
  conflict, 11 unsafe path, 12 registry failure) with the most specific causal
  class winning, plus safe-locator validation, status invariants and
  deterministic canonical rendering. `schemaVersion` is the independent
  protocol version.
- `specs/API_CONTRACTS.md` records the frozen v1 protocol/exit map.

## Files changed or added

| Path                                                                          | Change   | Purpose                     |
| ----------------------------------------------------------------------------- | -------- | --------------------------- |
| `schema/v1/command-envelope.schema.json`                                      | new      | Envelope schema.            |
| `src/cli/protocol.ts`                                                         | new      | Envelope/exit model.        |
| `tests/unit/protocol.test.ts`                                                 | new      | S022 direct tests.          |
| `specs/API_CONTRACTS.md`                                                      | modified | Frozen protocol/exit map.   |
| `implementation/COMMIT_SEQUENCE.md`, `implementation/evidence/S021_REPORT.md` | modified | Record S021 pending review. |

## Verification

| Check                 | Command                                             | Exit | Result          |
| --------------------- | --------------------------------------------------- | ---- | --------------- |
| Direct lane           | `pnpm run test:unit -- tests/unit/protocol.test.ts` | 0    | 9 tests, 9 pass |
| Typecheck (4 configs) | `pnpm run typecheck`                                | 0    | exit 0          |
| Format / lint         | `pnpm run format:check`, `pnpm run lint`            | 0    | clean           |
| Contract validation   | `pnpm run check:contracts`                          | 0    | 0/0             |
| Whitespace            | `git diff --check`                                  | 0    | no diagnostics  |

## Self-review findings

- Every status maps to a stable exit; failure classes override the ordinary
  error exit deterministically.
- Unsafe physical locators/paths, `planned` changes marked applied,
  `no_change` with changes and `error` without an error diagnostic all fail.
- Rendering is canonical and exactly one JSON document.

## Limitations

- The real adapter still emits the bootstrap help/version output; S023 replaces
  its argument grammar and wires honest envelopes. Pending Codex review.

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
