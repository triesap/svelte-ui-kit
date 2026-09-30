# S013 step report — Model independent version identities

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S013","kind":"report","commit":"bbd3cf4b0f07ebb9f82f259577a5d1ff17ed6878","disposition":"candidate"}
-->

Step ID and title: S013 — Model independent version identities.

Contract/requirement IDs: R12, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/DATA_MODEL.md`,
`decisions/ADR-0001-architecture.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. This checkpoint adds the
approved exact runtime dependency `semver` 7.8.5 and the exact development
types `@types/semver` 7.8.0; no other dependency changed.

## Scope implemented

- `src/registry/errors.ts` introduces the shared typed model vocabulary
  (`ModelIssue`, `ModelResult`, `ModelError`) used by later registry,
  project, config and protocol checkpoints. Diagnostics carry a stable machine
  code and an optional _logical_ locator, never a host path.
- `src/registry/versions.ts` models the independent axes: positive-integer
  schema/protocol/contract revisions start at `1`; tool, empty-registry and item
  releases are strict SemVer `0.1.0`; frame compatibility is a separate npm
  range restricted to the qualified Svelte `^5.57.1` / Bits `^2.19.3` baseline
  plus the real `@internationalized/date` `^3.8.1` peer; content identity is
  exact-byte lowercase 64-hex SHA-256. `changedVersionAxes` reports each axis
  independently, so a compatibility change never implies a schema migration.
- `specs/DATA_MODEL.md` records the initial technical identities next to the
  existing version-axis contract.
- `tests/unit/versions.test.ts` covers strict SemVer (including build metadata
  and prerelease), npm ranges versus git/file/url sources, digest format,
  per-axis diffs, multi-issue collection and typed `ModelError` assertions.

## Files changed or added

| Path                             | Change   | Purpose                                     |
| -------------------------------- | -------- | ------------------------------------------- |
| `src/registry/errors.ts`         | new      | Shared typed model issues and result type.  |
| `src/registry/versions.ts`       | new      | Independent version identities/validators.  |
| `tests/unit/versions.test.ts`    | new      | S013 direct model tests.                    |
| `specs/DATA_MODEL.md`            | modified | Record the initial technical identities.    |
| `package.json`, `pnpm-lock.yaml` | modified | Add approved `semver`/`@types/semver` pins. |

## Verification

| Check                 | Command                                                 | Exit | Result                      |
| --------------------- | ------------------------------------------------------- | ---- | --------------------------- |
| Frozen strict install | `pnpm install` (locked graph; `@types/semver` resolved) | 0    | semver 7.8.5, types 7.8.0   |
| Direct lane           | `pnpm run test:unit -- tests/unit/versions.test.ts`     | 0    | 9 tests, 9 pass             |
| Full unit             | `pnpm run test:unit`                                    | 0    | 29 tests, 29 pass           |
| Typecheck (4 configs) | `pnpm run typecheck`                                    | 0    | exit 0                      |
| Format                | `pnpm run format:check`                                 | 0    | all matched files formatted |
| Lint                  | `pnpm run lint`                                         | 0    | no findings                 |
| Contract validation   | `pnpm run check:contracts`                              | 0    | 0 error(s), 0 warning(s)    |
| Whitespace            | `git diff --check`                                      | 0    | no diagnostics              |

The reference worktree guard is **reused** at the audited clean revision
`a10fbf06334f4648f5755e05a7147414e4e5fc98` (unchanged; fresh guard at the
sequence milestone). This TS-only checkpoint creates no Rust code.

## Self-review findings

- `semver.valid` is lenient (trims whitespace, accepts a leading `v`, drops
  build metadata), so strict release validation uses the official grammar and
  keeps `semver` as the npm range/intersection authority. The first unit run
  caught exactly this; the check was corrected rather than weakening the test.
- All axes are validated independently; no compatibility value is reused as a
  schema version.

## Limitations

- Only the version-identity model exists; no schema file, registry, resolver or
  CLI command is implemented or claimed here.
- The checkpoint is pending independent Codex review; it is not Codex-accepted.

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
