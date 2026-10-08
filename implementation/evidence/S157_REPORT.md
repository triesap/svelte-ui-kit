# S157 step report — Qualify Avatar native image and fallback behavior

Author: Codex. Independently accepted on code `a79db79f78818797e2b3d541731797b5b19b60ce` at evidence `871c1945daf660d9f0f724fb949057b4fa3a1da6`.
Original implementation commit: `080c7cdf4ff7fdf4fc2ee011767c9deeab23a750`. The candidate narrative below
is historical implementation and verification provenance.
Implementation commit: `080c7cdf4ff7fdf4fc2ee011767c9deeab23a750`.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S157","kind":"report","commit":"871c1945daf660d9f0f724fb949057b4fa3a1da6","disposition":"implemented"}
-->

Original R03, R20, R22, R23, R25, R26, R29, R32, R33, R34.
Starting `ee3149e87cff48315e2db02ac2c1c634e0274a7c` on `master`.

Build actual CLI-installed Avatar applications in default/custom source layouts,
verify exact generated source bytes and attach registry/lock/styles/source/build
identities. Eighteen Chromium cases exercise real controlled native image
requests, delayed loading/success, decoding failure/recovery, empty source,
independent states, meaningful/decorative alternate text, native attrs/classes/
request hints/ref, hidden/aria-hidden/until-found, keyed replacement, stale events,
native responsive selection, teardown/remount, and eight concurrent SSR responses
per layout. Check all source declarations and target fallback dimensions/colors,
live radius/theme, caller dimensions, RTL and reduced motion.

The initial10/18 run found a real detached-image event callback leak. Internal
state already rejected obsolete identities, but normal caller callbacks still ran
for the detached image. Guard normal load/error delivery by current image and
request as well, bump Avatar cohort to0.1.1 and refresh registry identity. Tests
retain the real delayed response and detached-node load/error controls, rejecting
extra callbacks and state changes. This repair explicitly awaits separate S181
assessment; author implementation review does not accept it independently.

Other initial failures were incorrect test assumptions: actual source radius is
999px, actual SSR asset() URLs are request-relative, and actual Svelte replays a
recorded pre-hydration native load once. Inspect pinned replay_events and prove
the original record before releasing client modules, unchanged SSR image node,
loaded state and exactly one native capture/load pair. Completion checks add no
synthetic caller event. Intermediate16/18 exposed the fixture assumption that an
already cached source would remain loading; retain its direct cached completion
and add a fresh revision URL to verify pending fallback/current-request completion.
Final18/18, without skips, weakened naming, hidden SSR or suppressed browser errors.

Record the actual Svelte SSR inline image event recorder boundary for later CSP
work; do not claim strict CSP from pure CSS. Worker launch retains the known
NO_COLOR/FORCE_COLOR environment warning. Actual browser/page/hydration/console
and owned-server guards remain strict; successful image failure simulation uses
owned200 malformed image responses, not masked HTTP404 console errors.

Verification through the configured build router:

- Exact Avatar Chromium file: final18/18, all default/custom installed cases.
- Avatar actual native types15/15 and immutable source CSS/metadata2/2.
- Requalified repaired source: real install/check/build/SSR/replay3/3.
- Full registry53/53 and real packed package3/3: exit0.
- Maintained fixture check/build and exact token projections: exit0; Svelte
  check reports zero errors/warnings.
- Typecheck, lint, format and governing contracts: exit0.
- Source/staged diff and whitespace review pass. Cargo N/A; no Rust affected.

Changed owning browser fixture/helper, native callback repair/cohort identity,
public map, predecessor bookkeeping and this report. CSS, types and metadata
remain unchanged from S156. No cross-platform/full-suite/strict-CSP/MVP or
independent acceptance claim. No blocker; continue original S158 after this green
commit; mandatory separate S181 acceptance gates S182. Reference source, original
criteria and unrelated changes remain intact; no push/publication/deployment.
