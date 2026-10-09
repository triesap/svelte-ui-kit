# Planning, ownership and synchronization

Scope: desired configuration, installed lineage, source/CSS/export/integration
planning and reconciliation. Authoritative code is [ownership policy](../../src/codegen/ownership-policy.ts),
[cohorts](../../src/codegen/cohorts.ts) and the other `src/codegen` planners;
[configuration/lock schemas](../reference/configuration.md) own serialized formats.
Apply/recovery belongs to [transactions](transactions.md), never a patcher's side effect.

## Ordered ownership policy

Evaluate ownership before equality. B is legitimate prior upstream base, L actual
local bytes, I authenticated incoming bytes. Apply independently to source files,
managed CSS and integration, then enforce cohorts. Absence is not a hash.

| Observation, in order       | Disposition                                                         |
| --------------------------- | ------------------------------------------------------------------- |
| Untracked and absent        | Create if incoming exists; otherwise no_change.                     |
| Untracked and present       | untracked_conflict even if L=I; no adoption/deletion rights.        |
| Tracked but missing locally | Visible conflict; no silent restoration or absence baseline.        |
| Tracked L=I                 | no_change, including missing recorded base; this precedes conflict. |
| Tracked L=B                 | Safe incoming update.                                               |
| Tracked I=B                 | Customized; preserve local bytes and legitimate base.               |
| Tracked otherwise           | Conflict; no overwrite or partial batch.                            |

Any source/CSS/integration conflict prevents the entire batch, including config
and lock updates. Report all deterministic causes. Hashes detect drift; they do
not reconstruct a merge base or authorize arbitrary accepted local hashes.

## Cohorts and truthful lineage

An item is the compatibility unit: source files, managed styles and public exports.
All satisfied members are clean; adoption is allowed when other members adopt or
are already satisfied. Mixing adoption with customization or conflict blocks the
whole unit because hashes do not establish semantic compatibility. Standalone
customization with unchanged upstream is not itself a conflict. Changed public
exports widen the unit through transitive registry dependents; unrelated unchanged
items do not become one permanent giant cohort.

Resolve explicit roots and closure, authenticate registry assets, read all managed
targets and compute dependencies/CSS/barrels/layout/config/lock before staging.
Freeze actual observations into the approved read set. Metadata records effective
lineage; retaining customized source cannot falsely advance its installed baseline.
A genuine metadata-only transition is still a planned transaction, while a
satisfied replay has no semantic writes.

## Retirement and structural preservation

Recompute closure from desired roots. Needed transitive items remain. Retire clean
unneeded generated targets only through safe planned transitions. Customized assets
remain application-owned and receive truthful detached diagnostics; subsequent
commands cannot silently reacquire them. Retained CSS becomes unmanaged text,
not a falsely current managed block. Preserve unrelated barrel exports and warn
about app imports with RETIRED_IMPORTS_REVIEW_REQUIRED; sync does not rewrite
arbitrary application source.

Parse and validate unique CSS owners, markers and ordering. Formatting changes
are local edits; do not reformat whole files. Managed export AST checks reject
colliding symbols, duplicate declarations and ambiguous unmanaged ownership while
preserving aliases/imports/comments. Layout patching preserves existing rendering
and supported style-import order, stops on dynamic/ambiguous structures and never
evaluates application config. Defaults and custom mappings have the same guarantees.

Inspect incoming source with view, dry-run sync, reconcile application work
deliberately, then rerun strict doctor and app qualification. There is no automatic
merge, force flag, synthetic accepted hash or hidden base-byte storage. Recovery
backups do not constitute a merge-history feature.

Owning controls include [ownership vectors](../../tests/fixtures/ownership-cases.json),
[cohort tests](../../tests/unit/cohorts.test.ts), unit source/CSS/barrel/layout planners,
and integration customization/retirement/unchanged-state and documented-upgrade
tests. Preserve every equality combination, missing tracked target and identical
untracked collision causal control. A clean helper test does not establish the
whole installed-consumer boundary.
