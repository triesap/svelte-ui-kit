# S171 step report — Generate native Progress source and managed styles

Author: Codex. Locally verified candidate; independent S181 acceptance pending.
Implementation commit: `a454ac5d73e074a5c81510dd3845fd2c9ae692d9`.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S171","kind":"report","commit":"a454ac5d73e074a5c81510dd3845fd2c9ae692d9","disposition":"candidate"}
-->

Original R02, R03, R04, R06, R08, R20, R22, R25, R26, R32, R33, R34.
Starting `55117a04923f15d3c98c8feccb10575dd1e3d296` on `master`.

Generate one native progress element with source numeric value/max default100,
source numeric fallback and actual bindable HTMLProgressElement ref. Omitted/null
value omits the value attribute for native indeterminate state; max null removes
the bound, leaving native1. Preserve caller attrs/class/style/name/value text/
events. Browser owns numeric normalization and progress state; no custom timer,
ARIA range store/task engine, primitive, name/variant or child recipe. Register
exactly Progress/ProgressProps, two source files and one compatible source/style
cohort with tokens-only dependency and no npm dependency.

Preserve all eight source CSS declarations. Add one narrowly scoped native hidden
rule because source block display overrides the user-agent hidden display; retain
until-found content visibility. Existing component radius/semantic metadata,
tokens version/projections and semantic CSS remain unchanged.

Owning real CLI suite proves complete source/export/cohort identity, no-effect
dry run, exact requested/transitive closure, all installed source/lock hashes and
managed blocks, actual consumer check/build and hashed production SSR handler,
whole-tree unchanged repeat add/sync in default/custom layouts. Server output
preserves associated label/default100/value25 fallback, named75/max80, zero,
indeterminate omission, explicit null bound omission, caller style/direction and
raw above-max numeric attr/explicit value text. Native DOM/AX normalization is
original S172, not inferred from source attributes.

Verification through the configured build router:

- Real install/check/build/SSR/replay3/3, first pass, both layouts: exit0.
- Strict actual native types20/20 plus source CSS/scoped hidden2/2: exit0.
- Full registry53/53 and packed package3/3: exit0.
- Maintained fixture check/build/exact projections, typecheck, lint, format and
  governing contracts: exit0; Svelte check zero errors/warnings.
- Source/staged diff and whitespace review pass. Cargo N/A; no Rust affected.

Changed complete component/manifest/source styles/root registry identity, owning
real install/CSS tests/source provenance, actual predecessor bookkeeping and
report. All native values/bounds/indeterminate accessible states, naming/refs/
controls/styles/themes/direction/motion and SSR/hydration remain original S172.
No independent/full-platform/MVP acceptance claim. No blocker; continue original
S172 after green commit; mandatory separate S181 gates S182. Source boundaries
and unrelated work remain intact. No push/publication/deployment.
