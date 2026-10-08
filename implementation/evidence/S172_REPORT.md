# S172 step report — Qualify native Progress values and visual states

Author: Codex. Independently accepted on code `a79db79f78818797e2b3d541731797b5b19b60ce` at evidence `871c1945daf660d9f0f724fb949057b4fa3a1da6`.
Original implementation commit: `3a69123effc6b8d9b4640b72cec6f11ee01f114d`. The candidate narrative below
is historical implementation and verification provenance.
Implementation commit: `3a69123effc6b8d9b4640b72cec6f11ee01f114d`.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S172","kind":"report","commit":"871c1945daf660d9f0f724fb949057b4fa3a1da6","disposition":"implemented"}
-->

Original R03, R20, R22, R23, R25, R26, R29, R32, R33, R34.
Starting `a454ac5d73e074a5c81510dd3845fd2c9ae692d9` on `master`.

Qualify actual default/custom CLI-installed production Progress with complete
source/lock/CSS/app/production hashes and consumer check/build logs. Seven tests
per layout use strict browser/server lifecycle collectors. Twelve live states
prove exact native attribute/control parity, value/max/position, zero/floats,
negative/above-bound values, nonpositive max, omitted/null value and bound,
nonfinite parsing, accessible bounds and retained node/ref/name. Actual DOM
negative controls prove numeric setters differ from attribute parsing, including
nonpositive max retaining its previous value and nonfinite value throwing.

REAL REPAIR: pinned Svelte numeric IDL updates do not preserve source numeric
attribute parsing, and its lowercase value removal sets zero instead of native
indeterminate omission. Serialize numeric attrs; use case-insensitive VALUE on
the generic spread path to avoid the special setter, and remove value when
null/undefined in a reactive native-ref effect after update. Native browser owns
all normalized values and state. No second percentage/ARIA store or timer. Bump
Progress cohort0.1.1 and refresh registry content digest. Metadata stays unchanged.
Separate S181 must assess this repair; author checks do not accept it.

Preserve native label/ARIA naming, read-only caller focus/events/form defaults,
explicit value-text attribute, ref teardown/remount and hidden/until-found. Actual
Chromium native progress ignores aria-valuetext in its accessible tree, including
the independent raw native control; preserve/document the attribute, not a spoken
value-text guarantee. Compute all eight source CSS declarations, every radius
fallback, caller geometry, live theme and RTL/reduced-motion CSS properties.
Visual inspection found native green/gray paint despite computed source colors.
Add narrowly scoped native bar/value pseudo-elements using existing primary
token/inherited background/radius; preserve all eight original declarations and
add no hooks. Three actual default/night/caller pixel-sampled foreground/track
pairs exactly match semantic colors and exceed3:1; retain measured JSON and
actual screenshots. Mozilla mapping is declaration-qualified, not measured in
another browser. Internal indeterminate animation remains user-agent behavior;
CSSOM no kit animation is not every-browser native animation certification.
Initial negative/nonfinite SSR-to-hydration states also match actual native
attribute controls without errors. Sixteen concurrent SSR responses isolate labels/values/counts/ref
state and native indeterminate omission with zero hydration/lifecycle errors.

Initial exact browser8/12 passed, four failures revealed real numeric setter and
native value-text boundaries. Intermediate10/12 and10/12 exposed removed-value
and mismatched direct-control setter paths. Preserve failed raw logs; do not count
them as passing lanes. Repair actual product attributes/absence, use independent
native DOM attribute controls, retain causal IDL controls and rerun the full lane.

Verification through the configured build router:

- Fresh complete generated browser14/14, no skips: exit0.
- Actual native types20/20 and immutable CSS/scoped hidden/native paint3/3: exit0.
- Repaired real install/check/build/SSR/replay3/3, registry53/53 and packed package3/3:
  exit0; actual source/manifest/content digest qualified together.
- Maintained fixture check/build/exact projections, typecheck, lint, format and
  governing contracts: exit0; Svelte check zero errors/warnings.
- Source/staged diff and whitespace review pass. Cargo N/A; no Rust affected.

Changed source-native attribute/paint repairs/version/digest, owning consumer helper/page/
browser tests, semantic map, actual predecessor bookkeeping and report. Original
S181/platform/full-MVP acceptance remains open. No blocker; continue S173 after
green commit; separate S181 gates S182. Standalone source boundaries and unrelated
work remain intact. No push/publication/deployment.
