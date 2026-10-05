# RCLD04-Q2 resulting-consumer qualification report

Implementation evidence for the owner-directed bounded dispatch `pfc RCLD04-Q2`
in `implementation/COMMIT_SEQUENCE.md`. This report records Pi implementation
coverage; it grants no independent acceptance, whole-group, RCLD-04 or MVP
completion, and it does not unlock S078 (which requires independent S077
acceptance).

## Boundary

- Start revision: `6db6d35c26f4b99c9a7f119b5dbb7fca18081560` (Q1 accepted).
- Implementation commits: `23bb639` (dispositions + shared fixture extraction +
  the folded-in owner-directed Q2 governance edits) and `afa7df9` (resulting
  default/custom consumer check/build/render).
- Committed pending review: S064–S077 remain `committed_pending_review`; S078 is
  still gated on independent S077 acceptance.
- Q3 (protocol qualifications/corrections) and Q4 (cumulative qualification)
  were not entered.
- No parent/coordinator change, reference-repository run, dependency change,
  push, publication or deployment occurred.
- Raw per-stage outputs, exits, response bodies and artifact digests are
  retained under the ignored `implementation/evidence/logs/rcl04-q2-*` tree; no
  raw runtime evidence is committed.

## Resulting-consumer matrix (six mapping/stage combinations)

`tests/smoke/q2-resulting-consumer.test.mjs` drives the representative
multi-item registry through the production
`captureSnapshot`/`planAdd`/`planSync`/`composeApplyPlan`/`validateApplyPlan`/
`applyPlan` core for a default and an independently rooted custom mapping
(`uiDir: app/ui`, `stylesDir: assets/styles`), across add → update →
retirement. At each combination the owned copy runs real `svelte-kit sync` +
`svelte-check --fail-on-warnings`, a production `vite build`, and a built
Node-adapter handler SSR request on an OS-assigned loopback port. The test page
imports the generated value and type exports from the mapped root (a derived
relative specifier; no alias or product API) and renders the generated
components with per-stage `data-*` markers.

| Mapping | Stage      | svelte-check | vite build | SSR | visible markers present          | markers absent                 |
| ------- | ---------- | ------------ | ---------- | --- | -------------------------------- | ------------------------------ |
| default | add        | 0            | 0          | 200 | BUTTON_RETAINED, CARD_ADDED_V1   | CARD_UPDATED_V2                |
| default | update     | 0            | 0          | 200 | BUTTON_RETAINED, CARD_UPDATED_V2 | CARD_ADDED_V1                  |
| default | retirement | 0            | 0          | 200 | BUTTON_RETAINED                  | CARD_ADDED_V1, CARD_UPDATED_V2 |
| custom  | add        | 0            | 0          | 200 | BUTTON_RETAINED, CARD_ADDED_V1   | CARD_UPDATED_V2                |
| custom  | update     | 0            | 0          | 200 | BUTTON_RETAINED, CARD_UPDATED_V2 | CARD_ADDED_V1                  |
| custom  | retirement | 0            | 0          | 200 | BUTTON_RETAINED                  | CARD_ADDED_V1, CARD_UPDATED_V2 |

The SSR markup carries both the page-level `data-*-marker` and the generated
component's own `data-kit-marker`, so the response proves the generated
component rendered rather than a fixture-only page.

### Source/artifact identity

Full digests are retained per stage in
`implementation/evidence/logs/rcl04-q2-*/<mapping>-<stage>-artifact-identity.log`.
The retained identity proves the update changes only the card owner and the
retirement removes it while the retained `button` cohort is byte-identical:

| Mapping | Stage      | barrel sha256 (prefix) | button sha256 (prefix) | card sha256 (prefix) |
| ------- | ---------- | ---------------------- | ---------------------- | -------------------- |
| default | add        | `dd075e2b1807419d`     | `9dc34da5a02dfcbf`     | `8416392f1a65f4d8`   |
| default | update     | `dd075e2b1807419d`     | `9dc34da5a02dfcbf`     | `deef3f65848a4bfb`   |
| default | retirement | `6443d9a08ce5c77e`     | `9dc34da5a02dfcbf`     | — (removed)          |
| custom  | add        | `dd075e2b1807419d`     | `9dc34da5a02dfcbf`     | `8416392f1a65f4d8`   |
| custom  | update     | `dd075e2b1807419d`     | `9dc34da5a02dfcbf`     | `deef3f65848a4bfb`   |
| custom  | retirement | `6443d9a08ce5c77e`     | `9dc34da5a02dfcbf`     | — (removed)          |

The consumer lane uses the same representative compound shape with
marker-bearing bodies and an added `ButtonProps` type cohort, so every stage
consumes a generated value export and a generated type export (including the
retained component after retirement). The exact add/update/retirement whole-tree
and ownership assertions continue to use the approved registry shape in the
integration suites below.

## Disposition matrix (default and custom)

`tests/integration/q2-multi-item-dispositions.test.ts` installs the approved
multi-item cohort through the guarded core, then exercises the satisfied,
metadata-only and conflicting dispositions using the existing production core
and asserts the exact whole resulting tree and derived lock ownership:

| Mapping | Disposition   | Plan outcome                                   | Tree / lock outcome                                               |
| ------- | ------------- | ---------------------------------------------- | ----------------------------------------------------------------- |
| default | satisfied     | executable, zero writes (no apply entered)     | whole tree and lock byte-identical; ownership ADDED unchanged     |
| default | metadata-only | executable, exactly the canonical lock written | exact planned tree (only lock changes); ownership ADDED unchanged |
| default | conflict      | not executable, zero writes                    | no semantic write; tree and lock unchanged                        |
| custom  | satisfied     | executable, zero writes (no apply entered)     | whole tree and lock byte-identical; ownership ADDED unchanged     |
| custom  | metadata-only | executable, exactly the canonical lock written | exact planned tree (only lock changes); ownership ADDED unchanged |
| custom  | conflict      | not executable, zero writes                    | no semantic write; tree and lock unchanged                        |

The conflicting case replaces the managed `card.svelte` target with a
non-regular directory and asserts the conflict diagnostic plus no semantic
write. The satisfied case never enters the guarded application: the whole tree
and canonical lock are compared byte-for-byte before and after planning.

## Preserved Q1 assertions

`tests/integration/multi-item-lifecycle.test.ts` keeps every accepted Q1
whole-tree, bytes/modes/kinds/links, ownership and retained-cohort assertion;
the registry and assertion primitives were extracted to
`tests/helpers/multi-item-fixture.ts` and
`tests/helpers/lifecycle-assertions.ts` without changing behavior. The two
default/custom lifecycle files still execute seven passing tests.

## Verification (repository commands, Node 24.21.0 / pnpm 11.22.0 pins)

| Command                                                                                                                                                                                           | Result                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `pnpm run build`                                                                                                                                                                                  | exit 0                                      |
| `node tools/run-unit-tests.mjs --suite integration tests/integration/multi-item-lifecycle.test.ts tests/integration/review16-matrix.test.ts tests/integration/q2-multi-item-dispositions.test.ts` | 3 files, 9 tests, 9 pass, 0 fail, 0 skipped |
| `node --test tests/smoke/lifecycle-consumer.test.mjs tests/smoke/q2-resulting-consumer.test.mjs`                                                                                                  | 3 tests, 3 pass, 0 fail                     |
| `pnpm run typecheck`                                                                                                                                                                              | exit 0                                      |
| `pnpm run format:check`                                                                                                                                                                           | exit 0                                      |
| `pnpm run lint`                                                                                                                                                                                   | exit 0                                      |
| `node tools/check-contracts.mjs --generate`                                                                                                                                                       | exit 0, projection unchanged                |
| `pnpm run check:contracts`                                                                                                                                                                        | 0 error(s), 0 warning(s)                    |
| `git diff --check` / `git diff --cached --check`                                                                                                                                                  | exit 0                                      |

Every mutating command ran through `cargo extbuild run --` after
`cargo extbuild doctor` reported a green configuration. The consumer child
processes inherit the extbuild router environment; only
`NODE_OPTIONS`/`NODE_V8_COVERAGE`/`NODE_TEST_CONTEXT` are dropped for the child.

## Remaining work

- RCLD04-Q3: remaining protocol qualification/corrections scoped from
  independent review of the authored repair candidate.
- RCLD04-Q4: full cumulative lanes and evidence reconciliation, followed by
  independent Codex acceptance of S064–S077 before S078.
- S078 is not entered; S064–S077 remain committed pending review.

No independent acceptance is claimed. The original S077 acceptance criteria,
R01–R34, AC01–AC22, the 63 accepted checkpoints and the live RCLD-04 pending
state are unchanged.
