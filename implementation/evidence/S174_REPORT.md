# S174 step report — Generate native Separator source and managed styles

Author: Codex. Locally verified candidate; independent S181 acceptance pending.
Implementation commit will be recorded after the green commit.

Original R02, R03, R04, R06, R08, R20, R22, R26, R32, R33, R34.
Starting `47dc157fb1a06762c0af2a6dd688ae280faca0a1` on `master`.

Generate one empty native div with source separator/horizontal defaults, source
orientation union, actual bindable div ref and native caller attrs/class/style/
naming/events. Owned data/ARIA orientation remains synchronized. Explicit
catalog decorative option renders role none/aria-hidden true, omits ARIA
orientation and keeps visual data orientation. Meaningful native aria-hidden
remains caller-owned. No extra node/text, splitter/value/keyboard control,
primitive/provider/identity/timer or animation. Register exactly Separator/
SeparatorProps/SeparatorOrientation, two source files and one compatible source/
style cohort with tokens-only dependency and empty npm list.

Preserve all six immutable source declarations in exactly three scoped source
rules, one managed block/layer. Horizontal/vertical logical geometry and border
color use existing semantic tokens. No new hooks, metadata/token version/
projection or semantic CSS changes. Vertical percentage sizing needs an
application ancestor with definite height; do not invent an extra layout wrapper.

Real CLI suite proves source/export/cohort identity, no-effect dry-run,
requested/transitive closure, exact source/lock hashes and managed blocks,
actual consumer check/build and hashed production SSR handlers, then whole-tree
unchanged repeat add/sync in default/custom layouts. SSR retains source default/
vertical semantics and caller names/attrs/classes, decorative omission/concealment,
meaningful native aria-hidden/hidden/style/direction. Four original divs/three
separator roles/one none role; no duplicate semantic or announcement node.

Verification through the configured build router:

- Real install/check/build/SSR/replay3/3, first pass in both layouts: exit0.
- Actual native/discriminated types20/20 plus immutable CSS1/1: exit0.
- Full registry53/53 and real packed package3/3: exit0.
- Maintained fixture check/build/exact projections, typecheck, lint, format and
  governing contracts: exit0; Svelte check zero errors/warnings.
- Source/staged diff and whitespace review pass. Cargo N/A; no Rust affected.

Changed complete source/manifest/styles/root identity, owning real install/CSS
fixtures/source provenance, actual predecessor bookkeeping and report. Actual
accessible decorative/orientation behavior, geometry/live theme/contrast/native
controls/ref/RTL/reduced motion and SSR/hydration remain original S175. No
independent/full-platform/MVP acceptance claim. No blocker; continue S175 after
green commit; mandatory separate S181 gates S182. Standalone boundaries and
unrelated work remain intact. No push/publication/deployment.
