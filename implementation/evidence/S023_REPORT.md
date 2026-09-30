# S023 step report — Parse only the approved CLI arguments

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S023","kind":"report","commit":"7625796a1bf7b7865f25fc4192a794fed8f4749a","disposition":"candidate"}
-->

Step ID and title: S023 — Parse only the approved CLI arguments.

Contract/requirement IDs: R09, R15, R18, R30, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/API_CONTRACTS.md`,
`specs/SECURITY_AND_TRANSACTIONS.md`, `specs/SYNCHRONIZATION.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.
This commit also records the bookkeeping that moves S022 to
`committed_pending_review`.

## Scope implemented

- `src/cli/args.ts` parses only the approved surface: `info`/`init`/`view`/`add`/
  `sync`/`doctor`; exactly one item for `view`/`add`; global `--json`/`--cwd`
  before or after the command; `--dry-run` only init/add/sync, `--source` only
  view, `--strict` only doctor. Duplicate/unknown flags, missing values, extra
  positionals, invalid item ids and unknown commands are usage errors.
  force/remove/auto-install/remote-registry options are rejected.
- `src/cli/run.ts` keeps help/version stable and returns an honest `unsupported`
  outcome for every approved-but-unimplemented command: one JSON envelope in
  `--json` mode, a human diagnostic otherwise; never a fake plan or write.
- `semver`/`ajv` are now loaded lazily, so the dependency-free bootstrap surface
  still runs from a built copy.
- The bootstrap unit/integration/smoke suites were adapted to the expanded
  grammar while retaining metadata, executable, failure and nonmutation
  coverage (including the existing-file-write and hard-coded-version mutants).

## Files changed or added

| Path                                                                                                                                      | Change   | Purpose                           |
| ----------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------- |
| `src/cli/args.ts`                                                                                                                         | modified | Approved argument grammar.        |
| `src/cli/run.ts`                                                                                                                          | modified | Help/version/unsupported results. |
| `src/registry/schema.ts`, `src/registry/versions.ts`                                                                                      | modified | Lazy dependency loading.          |
| `tests/unit/args.test.ts`                                                                                                                 | new      | S023 direct tests.                |
| `tests/unit/boundaries.test.ts`, `tests/unit/protocol.test.ts`, `tests/integration/harness.test.ts`, `tests/smoke/cli-bootstrap.test.mjs` | modified | Adapted grammar coverage.         |
| `implementation/COMMIT_SEQUENCE.md`, `implementation/evidence/S022_REPORT.md`                                                             | modified | Record S022 pending review.       |

## Verification

| Check                  | Command                                                        | Exit | Result            |
| ---------------------- | -------------------------------------------------------------- | ---- | ----------------- |
| Direct lane            | `pnpm run test:unit -- tests/unit/args.test.ts`                | 0    | 8 tests, 8 pass   |
| Protocol regression    | `pnpm run test:unit -- tests/unit/protocol.test.ts`            | 0    | 9 tests, 9 pass   |
| CLI smoke              | `pnpm run test:cli-bootstrap`                                  | 0    | 49 tests, 49 pass |
| Unit / harness         | `pnpm run test:unit`, `pnpm run test:harness`                  | 0    | green             |
| Integration/components | `pnpm run test:integration`, `pnpm run test:components`        | 0    | 15/15, 22/22      |
| Format / lint / type   | `pnpm run format:check`, `pnpm run lint`, `pnpm run typecheck` | 0    | clean             |
| Contract validation    | `pnpm run check:contracts`                                     | 0    | 0/0               |

## Self-review findings

- No approved command plans or writes anything; `--json` emits exactly one
  envelope and human mode uses stderr with exit 2.
- The adapter still validates package metadata before argument handling.

## Limitations

- Real command handlers are later sequences; S027 adds the registry lane.
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
