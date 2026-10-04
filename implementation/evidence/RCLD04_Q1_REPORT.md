# RCLD04-Q1 whole-tree lifecycle assertion report

Implementation evidence for the owner-directed bounded dispatch `pfc RCLD04-Q1`
in `implementation/COMMIT_SEQUENCE.md`. This report records Pi implementation
coverage; it grants no independent acceptance, whole-group, RCLD-04 or MVP
completion, and it does not unlock S078.

## Boundary

- Start revision: `fc4d9c0aaba1f66d920f3bf4d492853d297c29e3`.
- Implementation commit: `ceb5d62b284d042c056861cf78042cf9ccd870c3`.
- Committed pending review: S064–S077 remain `committed_pending_review`; S078 is
  still gated on independent S077 acceptance.
- The owner-directed Q1 governance edits (`AGENTS.md`,
  `implementation/COMMIT_SEQUENCE.md`, `implementation/VERIFICATION.md`) are
  folded into the implementation commit as instructed.
- Q2, Q3 and Q4 were not entered.

## Scenarios strengthened

1. **Default multi-item add.** `tests/integration/multi-item-lifecycle.test.ts`
   drives a real add of `card` (with transitive `button`) through the original
   snapshot, `planAdd`, `composeApplyPlan`, `validateApplyPlan` and `applyPlan`.
   The complete resulting tree is compared against the captured pre-state plus
   the composed plan.
2. **Default multi-item update.** The same consumer updates only the `card`
   owner through `planSync`; the retained `button` owner is proven byte-identical
   and every unrelated entry is unchanged.
3. **Default multi-item retirement.** `card` is retired while `button` is
   retained; the retired source files and CSS blocks are removed and the
   retained cohort, lock ownership and unrelated page survive exactly.
4. **Independently rooted custom mapping.** The same add → update → retirement
   lifecycle is parameterized over `uiDir: app/ui` and
   `stylesDir: assets/styles`, proving the generated tree, ownership and cohorts
   under separately rooted UI and styles destinations.
5. **Default and custom initialization.** `tests/integration/review16-matrix.test.ts`
   now compares the complete default init tree and the complete custom-mapping
   init tree against the pre-state plus the composed production plan.
6. **Ownership and cohorts.** Every managed file record, CSS block record, item
   origin and layout/stylesheet/exports integration is compared against an
   explicit expectation derived from the fixture, for both mappings and at every
   lifecycle stage.

## Assertion model

`tests/helpers/tree-snapshot.ts` adds `assertTreeAfterMutations`: the expected
tree is built from the captured `before` snapshot and the exact composed
mutations (`plan.targets` plus the canonical lock publication). Planned
create/update postimages must match bytes, modes and kinds; retirements must
disappear; pre-existing entries (including symlinks and their targets) must
survive unchanged. The only permitted additions are parent directories that a
mutation requires as a structural ancestor, so transaction residue, unexplained
additions/removals or field changes fail.

## Verification (repository commands, Node 24 / pnpm 11 pins)

| Command                                                                                                                                      | Result                                      |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `pnpm run build`                                                                                                                             | exit 0                                      |
| `node tools/run-unit-tests.mjs --suite integration tests/integration/multi-item-lifecycle.test.ts tests/integration/review16-matrix.test.ts` | 2 files, 7 tests, 7 pass, 0 fail, 0 skipped |
| `pnpm run typecheck`                                                                                                                         | exit 0                                      |
| `pnpm run format:check`                                                                                                                      | exit 0                                      |
| `pnpm run lint`                                                                                                                              | exit 0                                      |
| `node tools/check-contracts.mjs --generate`                                                                                                  | exit 0, projection consistent               |
| `pnpm run check:contracts`                                                                                                                   | 0 error(s), 0 warning(s)                    |
| `git diff --check` / `git diff --cached --check`                                                                                             | exit 0                                      |

Raw command outputs and exits are retained under the ignored
`implementation/evidence/logs/` tree; no raw runtime evidence is committed.

## Remaining Q1-external work

- RCLD04-Q2: resulting default/custom multi-item consumer check/build/render and
  the remaining lifecycle matrix cells.
- RCLD04-Q3: remaining protocol qualification and corrections scoped after
  independent review.
- RCLD04-Q4: full cumulative checks and evidence, followed by independent Codex
  acceptance of S064–S077 before S078.

The original S077 acceptance criteria, R01–R34, AC01–AC22, the 63 accepted
checkpoints and the live RCLD-04 pending state are unchanged.
