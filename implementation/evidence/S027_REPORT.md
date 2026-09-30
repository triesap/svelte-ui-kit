# S027 step report — Add full registry asset health validation

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S027","kind":"report","commit":"74f6c3b157333b2047755453c6e14d34e6839b9c","disposition":"candidate"}
-->

Step ID and title: S027 — Add full registry asset health validation.

Contract/requirement IDs: R08, R26, R30, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/API_CONTRACTS.md`,
`specs/ARCHITECTURE.md`, `specs/COMPONENT_CATALOG.md`, `specs/DATA_MODEL.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.
This commit also records the bookkeeping that moves S026 to
`committed_pending_review`.

## Scope implemented

- `src/registry/validate.ts` validates the packaged schema identities against
  the parser's expected local URNs and validates full registry health: the
  advertised snapshot (which enforces that advertised items reference existing
  files and valid blocks) plus a qualification inventory that distinguishes
  registered, installable items from unregistered candidate authoring manifests
  under `registry/ui/`.
- `AssetProvider.list` lists regular files under an allowed prefix without
  following symlinks, so the inventory cannot escape the package root.
- `test:registry` is added to the typed runner, `tsconfig.registry.json`, the
  combined `typecheck`, and the CI workflow. The runner harness gains registry
  selection/isolation and empty-suite coverage.

## Files changed or added

| Path                                                                          | Change       | Purpose                             |
| ----------------------------------------------------------------------------- | ------------ | ----------------------------------- |
| `src/registry/validate.ts`                                                    | new          | Schema identity + health/inventory. |
| `src/registry/assets.ts`                                                      | modified     | Symlink-safe asset listing.         |
| `tests/registry/health.test.ts`                                               | new          | S027 direct tests.                  |
| `tools/run-unit-tests.mjs`, `tools/run-unit-tests.test.mjs`                   | modified     | Registry suite + harness.           |
| `tsconfig.registry.json`, `package.json`, `.github/workflows/ci.yml`          | new/modified | Registry lane wiring.               |
| `implementation/COMMIT_SEQUENCE.md`, `implementation/evidence/S026_REPORT.md` | modified     | Record S026 pending review.         |

## Verification

| Check                 | Command                                  | Exit | Result              |
| --------------------- | ---------------------------------------- | ---- | ------------------- |
| Direct lane           | `pnpm run test:registry`                 | 0    | 4 tests, 4 pass     |
| Runner harness        | `pnpm run test:harness`                  | 0    | 37 tests, 37 pass   |
| Unit                  | `pnpm run test:unit`                     | 0    | 125 tests, 125 pass |
| Typecheck (5 configs) | `pnpm run typecheck`                     | 0    | exit 0              |
| Format / lint         | `pnpm run format:check`, `pnpm run lint` | 0    | clean               |
| Contract validation   | `pnpm run check:contracts`               | 0    | 0/0                 |

## Self-review findings

- A candidate manifest is visible in the inventory but `isInstallable` is
  false; the advertised snapshot ignores it (its bytes are not in the root
  identity).
- A schema whose `$id` or draft-07 `$schema` differs fails; an advertised item
  missing its source fails.
- The registry lane keeps the runner's explicit-selection, containment, real
  failure and zero-test guarantees, with harness coverage.

## Limitations

- Dependency resolution/cycle handling is S028. Pending independent Codex
  review.

## RCLD-02 review-1 repair note

Independent review 1 of the committed S013-S032 candidate requested changes
under the seven RCLD02-R1 closure groups. The original implementation evidence
and commit hash above are retained as provenance; they are not acceptance. The
repaired candidate is committed as green local checkpoints and verified fresh in
`implementation/evidence/RCLD-02_QUALIFICATION.md`. This checkpoint remains
`committed_pending_review`; no acceptance counter or accepted hash changes.
