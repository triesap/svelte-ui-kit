# S151 step report — Qualify Anchor behavior in the generated app

Author: Codex. Independently accepted on code `a79db79f78818797e2b3d541731797b5b19b60ce` at evidence `871c1945daf660d9f0f724fb949057b4fa3a1da6`.
Original implementation commit: `01baa6da87894397e1a22169a57158458c82fab6`. The candidate narrative below
is historical implementation and verification provenance.
Implementation commit: `01baa6da87894397e1a22169a57158458c82fab6`.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S151","kind":"report","commit":"871c1945daf660d9f0f724fb949057b4fa3a1da6","disposition":"implemented"}
-->

Original R03, R20, R22, R23, R26, R29, R32, R33, R34.
Starting `1737f32b2d69680c819f68316e9d08f4a8eb9a4f` on `master`.

Actual default/custom CLI-built production consumers qualify native navigation,
caller attrs/classes/snippets, real anchor refs and conditional cleanup/remount.
Pointer/Enter callbacks fire once; Space matches the independent raw native link
without activating. Native focus/tab order and caller cancellation are retained;
surrounding forms never submit/reset. Query/fragment navigation updates the real
browser URL and request-derived page state. Actual blank-target popups protect
opener, named targets reuse their browsing context, and synthetic external URL
navigation is intercepted locally without network dependence. Native download
produces the exact filename and response bytes. Dynamic target/rel retains node
identity and omitted/default/explicit/empty values. Aria-disabled remains native
attribute semantics, without a kit navigation engine.

All source theme/hover/focus defaults, all nine custom hooks, RTL and native
reduced-motion absence of animation/transition pass computed-style checks.
Eight concurrent real production requests per layout isolate query/count state;
the live hydrated page retains its own initial state. Browser/popup diagnostics
and owned server teardown are enforced. The consumer helper validates both exact
source files, records installed source/barrel/style/lock and all production hashes,
and retains real check/build logs and per-case artifact identities.

Initial package-script invocation forwarded a separator as a filter and started
the cumulative suite. Stop that exact owned process with SIGINT;42 unrelated
cases passed,1 interrupted,376 unrun, exit130. No passing lane is claimed from
that invocation. Its maintained fixture build phase completed successfully.
Use the exact Playwright runner thereafter. First focused attempt failed both
beforeAll hooks (18 unrun): the owned fixture had no static directory for the
download file. Create only that owned directory and rerun all20cases fresh;
all pass. Product Anchor source and CSS are unchanged by these fixture fixes.

Changed: generated-consumer helper, dedicated qualification route/browser suite,
Anchor worksheet, predecessor bookkeeping and this report.

Verification through the configured build router:

- `pnpm exec playwright test --config playwright.config.ts tests/browser/anchor.spec.ts`:
  final20/20, exit0; actual default/custom check/build and production browser/SSR.
- Owning Anchor type/CSS/lint-boundary component selection:17/17, zero
  failures/skips/TODOs/cancellations.
- Maintained fixture check and build phase: exit0, zero Svelte errors/warnings;
  exact token fixture projections pass.
- Typecheck, lint, format and governing contracts: exit0.
- Source/staged diff and whitespace review pass. Cargo N/A; no affected Rust
  workspace. No final cross-engine/platform/package/AC20 acceptance is claimed.

No remaining blocker. S149/S150 remain green pending sequence review at actual
implementation anchors. Continue only to original S152 after this green commit;
separate S181 acceptance still gates S182. No reference source change, push,
publication or deployment.
