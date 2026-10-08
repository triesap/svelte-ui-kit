# S150 step report — Generate Anchor source and managed styles

Author: Codex. Independently accepted on code `a79db79f78818797e2b3d541731797b5b19b60ce` at evidence `871c1945daf660d9f0f724fb949057b4fa3a1da6`.
Original implementation commit: `1737f32b2d69680c819f68316e9d08f4a8eb9a4f`. The candidate narrative below
is historical implementation and verification provenance.
Implementation commit: `1737f32b2d69680c819f68316e9d08f4a8eb9a4f`.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S150","kind":"report","commit":"871c1945daf660d9f0f724fb949057b4fa3a1da6","disposition":"implemented"}
-->

Original R02, R03, R04, R06, R08, R20, R22, R26, R32, R33, R34.
Starting `3fccd821faa50e99c3696593b21971ee451afbff` on `master`.

Implement the frozen native anchor with required href/children, real bindable
anchor ref, caller attrs/classes/events and current blank-target rel derivation.
No kit keyboard/click/navigation handler or routing dependency is added. Register
only the complete two-source/three-export/one-style anchor cohort with tokens as
its sole dependency and no npm runtime requirement.

All eight immutable source CSS declarations and nine source hooks are retained
under the component layer and managed block. Append nine customization records
while preserving the exact original263records (272 total), and update only the
tokens metadata version to0.1.10 and its exact maintained fixture projection.
Semantic token CSS and theme contract are unchanged.

Actual default/custom CLI consumers verify complete source bytes, flat value/type
exports, source/style lock hashes, dependency closure, no-effect dry run,
native SSR attrs/classes, current rel safety defaults and explicit/empty rel,
named contexts and download. Both consumers typecheck/build and render through
their actual production handler; handler SHA is checked. Complete trees remain
unchanged after repeated add/sync. S151 owns actual browser navigation/ref/state
and computed-style qualification.

Initial lint exposed SvelteKit's application resolution rule on the generic
native wrapper. Calling resolve() inside Anchor would change caller-owned URLs
and introduce the routing dependency excluded by the frozen API. Document and
scope ignoreLinks only to this exact wrapper, keeping all navigation-call and
compiler/accessibility checks. A causal real-ESLint boundary fixture requires
unresolved application links and wrapper goto calls to fail, resolved application
links and the actual wrapper to pass, and an inaccessible wrapper img to retain
its compiler accessibility failure. This is a bounded authoring scope decision,
pending independent S181 assessment; no global rule or browser check is disabled.

Changed: Anchor component/manifest/style, root registry, customization metadata,
tokens manifest and fixture projection, Anchor map and ESLint scope, dedicated
install/CSS/source-provenance/lint-boundary fixtures, predecessor bookkeeping and
this report.

Fresh checks through the configured build router:

- Owning install integration:3/3; default/custom CLI check/build/production SSR.
- Anchor types/CSS:16/16; independent source8declaration fixture and original
  customization record hash. Causal lint-boundary fixture:1/1.
- Full registry53/53 and real packed package3/3: exit0.
- Maintained fixture check/build and exact token projection: exit0, zero Svelte
  errors/warnings.
- CLI build, typecheck, lint, format and governing contracts: exit0.
- Source/staged diff and whitespace review pass. Cargo N/A; no affected Rust
  workspace. Browser qualification remains S151, not claimed here.

No remaining blocker. S149 remains committed pending sequence review at its
actual implementation anchor; only original S151 follows this green commit.
Reference sources and all original criteria are preserved. No push/publication
or deployment.
