# Requirement and acceptance evidence

This map supplements the [live ledger](COMMIT_SEQUENCE.md); it grants no
acceptance and changes no original requirement. S001–S193 are independently
accepted at the recorded sequence anchors. S194–S200 are candidates and S201
is blocked by its raw strict prerequisite. Final cumulative qualification and separate S203 acceptance remain
open. Links identify actual maintained implementation/tests or recorded evidence;
they are not claims that every suite was freshly rerun at this checkpoint.

The [RCLD-10 qualification](evidence/RCLD-10_QUALIFICATION.md) distinguishes
fresh acceptance runs from unchanged historical lanes. S194–S200 reports record
new local package, metadata, operational and example checks. The
[compatibility record](evidence/COMPATIBILITY.md) bounds Node/pnpm/Svelte/Bits,
Chromium/macOS/Linux coverage and unexecuted CI. Raw full library checking still
fails exactly two upstream TS2590 diagnostics, despite seven actual alternative
probes. [The separate assessment](evidence/S196_STRICT_ASSESSMENT.md) accepts
no final checkpoint. Qualified exception controls do not satisfy final AC20.

## Stable requirements

| ID  | Implementation and test evidence                                                                                                                                                         | Status and bounds                                                                  |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| R01 | [Package identity](../package.json), [actual metadata](../tests/package/metadata.test.ts), [S196](evidence/S196_REPORT.md)                                                               | Private local package candidate; no publication authorized or performed.           |
| R02 | [Consumer graph](../tests/helpers/consumer-graph.ts), [packed consumer](../tests/package/generated-consumer.test.ts), [S195](evidence/S195_REPORT.md)                                    | App-owned source and no kit runtime qualified; final review pending.               |
| R03 | [Component maps](../specs/COMPONENT_CATALOG.md), [catalog parity](../tests/registry/catalog-parity.test.ts)                                                                              | Native/Bits mapping accepted through S193.                                         |
| R04 | [Styling](../specs/STYLING.md), [pure CSS tests](../tests/browser/css-contracts.spec.ts)                                                                                                 | Authored CSS; no utility conversion/runtime introduced.                            |
| R05 | [Config](../src/project/config.ts), [config tests](../tests/unit/config.test.ts)                                                                                                         | Default and custom mappings qualified.                                             |
| R06 | [Exports](../src/codegen/exports.ts), [public exports](../tests/registry/public-exports.test.ts)                                                                                         | Flat names and type-only directions qualified.                                     |
| R07 | [CSS parser](../src/codegen/css-parse.ts), [CSS coverage](../tests/registry/css-contract-coverage.test.ts)                                                                               | Tool markers, classes, properties and source fallbacks qualified.                  |
| R08 | [Bundled assets](../src/registry/assets.ts), [inventory](../tests/package/inventory.test.ts), [S194](evidence/S194_REPORT.md)                                                            | Actual isolated tarball qualified; final review pending.                           |
| R09 | [CLI](../src/cli/main.ts), [documented workflow](../tests/integration/documented-workflow.test.ts), [S197](evidence/S197_REPORT.md)                                                      | Approved commands only; operational candidate.                                     |
| R10 | [Dependency plans](../src/registry/dependency-plan.ts), [instructions](../tests/integration/dependency-instructions.test.ts), [S197](evidence/S197_REPORT.md)                            | Explicit dependency setup; no automatic manifest/manager mutation.                 |
| R11 | [Requests](../src/project/requests.ts), [retirement](../tests/integration/plan-retirement.test.ts)                                                                                       | Explicit requests and resolved closure accepted.                                   |
| R12 | [Versions](../src/registry/versions.ts), [migration/schema tests](../tests/integration/schema-versions.test.ts)                                                                          | Separate version domains and supported migrations qualified.                       |
| R13 | [Source comparison](../tests/unit/source-compare.test.ts), [CSS comparison](../tests/unit/css-compare.test.ts), [upgrade examples](../tests/integration/docs-upgrade.test.ts)            | Frozen equality policies; current operational candidate.                           |
| R14 | [Cohorts](../src/codegen/cohorts.ts), [cohort tests](../tests/unit/cohorts.test.ts), [S195](evidence/S195_REPORT.md)                                                                     | Atomic conflict refusal qualified; no automatic merge.                             |
| R15 | [Planner](../src/codegen/plan.ts), [whole-tree snapshots](../tests/helpers/tree-snapshot.ts), [workflow](../tests/integration/docs-upgrade.test.ts)                                      | Read-only plans/diagnosis and stable replay qualified.                             |
| R16 | [Guarded apply](../src/codegen/apply.ts), [transaction safety](../tests/integration/transaction-safety.test.ts), [recovery](../tests/integration/docs-recovery.test.ts)                  | Trusted-local macOS/Linux boundary; hostile races and Windows unsupported.         |
| R17 | [Layout parsing](../src/codegen/svelte-parse.ts), [layout matrix](../tests/integration/layout-matrix.test.ts), [barrels](../tests/integration/compound-exports.test.ts)                  | Unmanaged regions and authenticated structural rendering retained.                 |
| R18 | [Source retirement](../tests/integration/source-retirement.test.ts), [clean retirement warning](../tests/integration/clean-retirement-warning.test.ts)                                   | Custom content survives; imports require manual review.                            |
| R19 | [Doctor](../src/cli/commands/doctor.ts), [customization diagnosis](../tests/integration/doctor-customization.test.ts)                                                                    | Customization differs from broken/unsafe state.                                    |
| R20 | [Component types](../tests/components/strict-declaration.test.ts), [public export graph](../tests/registry/public-exports.test.ts), [strict blocker](evidence/S196_STRICT_ASSESSMENT.md) | Native contracts qualified; raw declaration blocker remains.                       |
| R21 | [Identity](../tests/integration/identity-ssr.test.ts), [catalog hydration](../tests/browser/catalog-hydration.spec.ts), [S189](evidence/S189_REPORT.md)                                  | App state isolated; pinned floating primitive process-counter boundary documented. |
| R22 | [Forms](../tests/browser/forms-composition.spec.ts), [accessibility](../tests/browser/accessibility-states.spec.ts), [examples](../tests/browser/composition-examples.spec.ts)           | Actual Chromium semantics qualified; no speech certification.                      |
| R23 | [Themes](../tests/browser/catalog-themes.spec.ts), [dialog themes](../tests/browser/dialog-themes.spec.ts)                                                                               | Global/nested hosts and live changes qualified; clipping caveats retained.         |
| R24 | [Menu CSP](../tests/browser/menu-csp.spec.ts), [collapsible CSP](../tests/browser/collapsible-csp.spec.ts)                                                                               | Actual CSP boundary qualified; no universal no-inline-style claim.                 |
| R25 | [Token contract](../tests/registry/token-contract.test.ts), [CSS contracts](../tests/browser/css-contracts.spec.ts)                                                                      | Source radius fallback and geometry retained.                                      |
| R26 | [Core acceptance](evidence/RCLD-06_QUALIFICATION.md), [catalog acceptance](evidence/RCLD-09_QUALIFICATION.md)                                                                            | Original core-first and early floating qualification preserved.                    |
| R27 | [Distinct Alert Dialog](../registry/ui/alert-dialog/root.svelte), [Alert Dialog browser](../tests/browser/alert-dialog-interactions.spec.ts)                                             | Distinct primitive and decision semantics qualified.                               |
| R28 | [Identity map](../specs/component-maps/identity.md), [router-link](../registry/ui/router-link.svelte), [examples](../tests/browser/composition-examples.spec.ts)                         | Native identity and thin anchor recipe; no router framework.                       |
| R29 | [Real generated consumers](../tests/helpers/generated-consumer.ts), [packed consumer](../tests/package/generated-consumer.test.ts), [S199](evidence/S199_REPORT.md)                      | Actual app check/build/browser qualification; final cumulative lane pending.       |
| R30 | [Wire contract](../specs/API_CONTRACTS.md), [CLI bootstrap](../tests/smoke/cli-bootstrap.test.mjs), [RCLD-10](evidence/RCLD-10_QUALIFICATION.md)                                         | Independent target protocol and source rigor retained.                             |
| R31 | [Extension gate](EXTENSION_GATE.md), [open questions](OPEN_QUESTIONS.md)                                                                                                                 | Gated direction only; scheduled S202 reconciliation pending.                       |
| R32 | [Original sequence](COMMIT_SEQUENCE.md), [contract regressions](../tools/check-contracts.test.mjs)                                                                                       | One active step and verified candidate commits; final independent gate pending.    |
| R33 | [Verification policy](VERIFICATION.md), [package manifest](../package.json)                                                                                                              | Cargo guards N/A: no affected Rust workspace.                                      |
| R34 | [Agent boundaries](../AGENTS.md), [license/identity qualification](evidence/S196_REPORT.md)                                                                                              | Repository/source boundaries preserved; no push/publication/deployment.            |

## Acceptance criteria

| ID   | Actual tests and recorded evidence                                                                                                                                                              | Status and bounds                                                                                                |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| AC01 | [Inventory](../tests/package/inventory.test.ts), [generated package consumer](../tests/package/generated-consumer.test.ts)                                                                      | Local package candidate; no consumer kit runtime.                                                                |
| AC02 | [Targets](../tests/registry/targets.test.ts), [public exports](../tests/registry/public-exports.test.ts)                                                                                        | Generated layout/names/cohorts qualified.                                                                        |
| AC03 | [Isolated executable](../tests/package/installed-runtime.test.ts), [S194](evidence/S194_REPORT.md), [S195](evidence/S195_REPORT.md)                                                             | Actual packed/install isolation candidate; publication not required or claimed.                                  |
| AC04 | [CLI smoke](../tests/smoke/cli-bootstrap.test.mjs), [RCLD-10](evidence/RCLD-10_QUALIFICATION.md)                                                                                                | Stable JSON/exits/help/error fixtures qualified.                                                                 |
| AC05 | [Documented upgrades](../tests/integration/docs-upgrade.test.ts), [recovery diagnosis](../tests/integration/docs-recovery.test.ts)                                                              | Complete-tree read-only and replay assertions; current docs candidate.                                           |
| AC06 | [Retirement](../tests/integration/catalog-retirement.test.ts), [clean warning](../tests/integration/clean-retirement-warning.test.ts)                                                           | Requests/closure and truthful detached ownership qualified.                                                      |
| AC07 | [Source comparison](../tests/unit/source-compare.test.ts), [CSS comparison](../tests/unit/css-compare.test.ts)                                                                                  | Frozen equality/collision/missing policies qualified.                                                            |
| AC08 | [Cohorts](../tests/unit/cohorts.test.ts), [packed consumer](../tests/package/generated-consumer.test.ts)                                                                                        | Whole-batch conflicts and truthful baselines qualified.                                                          |
| AC09 | [Layout matrix](../tests/integration/layout-matrix.test.ts), [root exports](../tests/integration/root-exports.test.ts), [CSS patches](../tests/integration/css-patch.test.ts)                   | Structural parsing/authority and unmanaged preservation qualified.                                               |
| AC10 | [Dependency state](../tests/integration/dependency-state.test.ts), [schema versions](../tests/integration/schema-versions.test.ts)                                                              | Actual dependency evidence and fail-closed schema/migration qualification.                                       |
| AC11 | [Filesystem paths](../tests/integration/filesystem-paths.test.ts), [platform record](evidence/S193_REPORT.md)                                                                                   | macOS/Linux safety lanes qualified; Windows/hostile races unsupported.                                           |
| AC12 | [Real process tests](../tests/integration/transaction-processes.test.ts), [recovery examples](../tests/integration/docs-recovery.test.ts)                                                       | Prior recovery qualified; no-change refusal remains open under R11-F03.                                          |
| AC13 | [Cleanup restart matrix](../tests/integration/cleanup-restart-matrix.test.ts), [published recovery](../tests/integration/recovery-published.test.ts)                                            | Lock-last recovery qualified; unchanged pending-state inspection remains open.                                   |
| AC14 | [Catalog parity](../tests/registry/catalog-parity.test.ts), [catalog maps](../specs/COMPONENT_CATALOG.md)                                                                                       | Original source mappings qualified; identity is native, Alert Dialog distinct.                                   |
| AC15 | [Native type fixtures](../tests/components/strict-declaration.test.ts), [strict assessment](evidence/S196_STRICT_ASSESSMENT.md)                                                                 | Wrapper types qualified; raw upstream declaration debt open.                                                     |
| AC16 | [Forms composition](../tests/browser/forms-composition.spec.ts), [overlay composition](../tests/browser/overlay-composition.spec.ts), [examples](../tests/browser/composition-examples.spec.ts) | Chromium interaction/semantic qualification; final cumulative rerun pending.                                     |
| AC17 | [Catalog hydration](../tests/browser/catalog-hydration.spec.ts), [S189](evidence/S189_REPORT.md), [RCLD-10](evidence/RCLD-10_QUALIFICATION.md)                                                  | SSR/hydration and state isolation qualified within recorded native ID boundary.                                  |
| AC18 | [CSS contracts](../tests/browser/css-contracts.spec.ts), [accessibility](../tests/browser/accessibility-states.spec.ts), [S185](evidence/S185_REPORT.md)                                        | Computed CSS qualified; baseline nontext contrast concerns remain documented.                                    |
| AC19 | [Theme browsers](../tests/browser/catalog-themes.spec.ts), [CSP](../tests/browser/menu-csp.spec.ts), [S199](evidence/S199_REPORT.md)                                                            | Portal/live theme and bounded CSP qualification; no zero-inline guarantee.                                       |
| AC20 | [Strict assessment](evidence/S196_STRICT_ASSESSMENT.md), [compatibility](evidence/COMPATIBILITY.md), [verification policy](VERIFICATION.md)                                                     | BLOCKED: two raw upstream TS2590 errors; final cumulative qualification and separate acceptance open. No waiver. |
| AC21 | [Live ledger](COMMIT_SEQUENCE.md), [operations](OPERATIONS_RUNBOOK.md), [command map](evidence/COMMANDS.md), [S199](evidence/S199_REPORT.md)                                                    | S001–S193 accepted; current final-sequence candidates and S201–S203 work remain unaccepted.                      |
| AC22 | [Extension gate](EXTENSION_GATE.md), [open questions](OPEN_QUESTIONS.md)                                                                                                                        | Direction documented; no unspecified APIs implemented. S202 and final gate pending.                              |

The [fresh S201 blocker](evidence/S201_BLOCKER.md) records the actual failed
raw strict prerequisite and all remaining cumulative obligations. S202/S203
remain dependent; no final acceptance or successful cumulative pass is claimed.

## Deviations and unresolved boundaries

The owner approved [R11-F01–R11-F06 in the sole governing plan](COMMIT_SEQUENCE.md)
on 2026-10-08: strict native diagnosis/resolution with a qualified source-fix
fallback, unchanged-command transaction inspection, full-suite CI, current
guidance/boundary dispositions and cumulative S201 qualification. Original
S202/S203 and separate final acceptance remain dependent. These are specified
repairs, not implemented fixes or acceptance evidence. AC12/AC13's prior
transaction qualification does not close the newly observed no-change bypass;
its missing refusal controls remain an explicit R11-F03 obligation.

The ledger's approved source interpretations and historical repair dispositions
remain authoritative. Authenticated export authority, lexical render proof,
form-owner reset capture, actual-tree description relationships, complete mixed
barrels and clean-retirement import warnings were independently accepted at
their recorded gates. No earlier finding is reopened or silently erased here.

The fixture's temporary library-check exception remains open final release debt.
Native first-opening completion, trusted reset cancellation, process-counter IDs,
closed force-mounted body locking, baseline Radio/Switch nontext contrast and
custom-host clipping remain bounded native/source observations, not hidden
workarounds or universal guarantees. No new dependency/API, type suppression,
SSR disablement, extension scope or acceptance waiver is introduced. App-owned
example placement beside isolated qualification templates preserves compilation
of the maintained consumer without unresolved installed-catalog imports.
