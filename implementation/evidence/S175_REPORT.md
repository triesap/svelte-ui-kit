# S175 step report — Qualify Separator semantics and visual states

Author: Codex. Independently accepted on code `a79db79f78818797e2b3d541731797b5b19b60ce` at evidence `871c1945daf660d9f0f724fb949057b4fa3a1da6`.
Original implementation commit: `02b5bd521081052f5947499e82ade9d4e0c373b1`. The candidate narrative below
is historical implementation and verification provenance.
Implementation commit: `02b5bd521081052f5947499e82ade9d4e0c373b1`.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S175","kind":"report","commit":"871c1945daf660d9f0f724fb949057b4fa3a1da6","disposition":"implemented"}
-->

Original R03, R20, R22, R23, R26, R29, R32, R33, R34.
Starting `04a71f87f8b53fe557ce6fc583c91071decae98f` on `master`.

Qualify actual CLI-installed production Separator in default/custom layouts with
complete source/lock/CSS/app/production hashes and actual consumer check/build
logs. Six tests per layout keep strict browser/server lifecycle issue collectors.
Actual Chromium tree matches direct native separator orientation, meaningful
name/description, and exclusion of decorative/caller-hidden nodes. Source empty
content remains empty; no message or extra semantic node. Dynamic orientation
and meaningful/decorative changes keep the div/ref, synchronize role/ARIA/data/
geometry and conceal the decorative accessible node without changing styling.

Native class/style/attrs/focus/pointer/keyboard/form defaults and ref teardown/
remount stay native; no splitter state or synthetic keyboard/action behavior.
All six source CSS declarations compute: nonflexible border-colored bar,
horizontal320px/1px and vertical1px/80px in an app-owned definite viewport,
live3px theme border width, independent inline geometry/color and RTL/reduced
motion. Sixteen concurrent SSR responses retain distinct naming, original roles/
orientation/concealment/count/ref state without leakage or hydration errors.

AC18 explicitly requires documenting baseline contrast concerns. Source light
border209/213/219 on white measures below3:1; app night border140/150/170 on25/30/40
exceeds3:1. Independent caller bar80/90/100 on that dark surface also falls below
3:1. Retain actual measured JSON and source semantic defaults, not an automatic
contrast certification or new palette/hook. Capture/review actual theme screenshot.
Existing application border tokens/styles own stronger boundaries when required.
No blanket WCAG/screen-reader speech claim.

Verification through the configured build router:

- Exact generated browser12/12, no skips, first pass in both layouts: exit0.
- Actual native/discriminated types20/20 plus immutable CSS1/1: exit0.
- Maintained fixture check/build/exact projections, typecheck, lint, format and
  governing contracts: exit0; Svelte check zero errors/warnings.
- Source/staged diff and whitespace review pass. Cargo N/A; no Rust affected.

Changed owning generated-consumer helper/page/browser tests, source semantic map,
actual predecessor bookkeeping and report. Product/registry/styles/metadata stay
unchanged. S174 registry53/package3/real-install3 remain prior checks, not fresh
claims. Independent S181/platform/full-MVP acceptance remains open. No blocker;
continue original S176 after green commit; separate S181 gates S182. Standalone
boundaries and unrelated work remain intact. No push/publication/deployment.
