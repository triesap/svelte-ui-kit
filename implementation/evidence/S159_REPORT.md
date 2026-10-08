# S159 step report — Generate source-native Badge

Author: Codex. Independently accepted on code `a79db79f78818797e2b3d541731797b5b19b60ce` at evidence `871c1945daf660d9f0f724fb949057b4fa3a1da6`.
Original implementation commit: `b9bdefaf6114312bb2c089aacba9d0ad7071bc98`. The candidate narrative below
is historical implementation and verification provenance.
Implementation commit: `b9bdefaf6114312bb2c089aacba9d0ad7071bc98`.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S159","kind":"report","commit":"871c1945daf660d9f0f724fb949057b4fa3a1da6","disposition":"implemented"}
-->

Original R02, R03, R04, R06, R08, R22, R25, R26, R32, R33, R34.
Starting `eb468371733fe04426342d457ef417b6f9682797` on `master`.

Generate the frozen single native span, direct required children rendering and
bindable native span ref, preserving caller attributes/classes/style/events.
Register exact Badge/BadgeProps exports, two flat source files and one compatible
badge source/style cohort. Tokens is the sole registry dependency; npm list is
empty. Add no variant, role, state, event wrapper, motion, form action or runtime
dependency. Preserve all ten immutable source CSS declarations unchanged through
the kit-managed block/layer. Existing semantic tokens and radius metadata suffice;
no foundation metadata, projection, token version or semantic CSS changes.

Owning real CLI suite proves complete manifest/source ownership, no-effect dry
run, explicit Badge/transitive tokens, exact installed source/style hashes and
bytes, correct managed blocks, flat exports, check/build, actual production
handler identity/rendering and whole-tree unchanged repeat add/sync in default
and custom source layouts. SSR retains meaningful nested children, native caller
attrs/classes/style/ARIA/tabindex/direction without automatic status/action roles.

Initial real install1/3 correctly rejected the authored fixture's string-valued
tabindex; component props inherit native numeric tabindex. Correct the fixture
to tabindex={0} without weakening public types, then rerun the complete lane.
An initial scripted fixture correction refused its unmatched escaped target and
left source unchanged; the corrected exact edit precedes the final rerun.
Final3/3 with actual Svelte check/build and zero Svelte errors/warnings.

Verification through the configured build router:

- Strict native Badge types13/13 and immutable source CSS parity1/1.
- Actual CLI install/check/build/SSR/unchanged replay3/3 across both layouts.
- Full registry53/53 and real packed package3/3: exit0.
- Maintained fixture check/build and exact token projections: exit0.
- Typecheck, lint, format and governing contracts: exit0.
- Source/staged diff and whitespace review pass. Cargo N/A; no Rust affected.

Changed component/manifest/styles, root registry identity, owning install/CSS
tests and immutable provenance fixture, predecessor bookkeeping and this report.
Actual browser dynamic text/native events/ref/theme/radius/color combinations and
SSR/hydration remain original S160. No independent/full-catalog/platform/MVP
acceptance claim. No blocker; continue S160 after this green commit; mandatory
separate S181 acceptance gates S182. Reference source, original definitions,
repository boundaries and unrelated changes remain intact. No push/publication/deployment.
