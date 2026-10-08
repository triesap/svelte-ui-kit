# S154 step report — Qualify the native Router Link recipe

Author: Codex. Locally verified candidate; independent S181 acceptance pending.
Implementation commit will be recorded after the green commit.

Original R20, R22, R28, R29, R32, R33, R34.
Starting `a9eeda45302854f1911d7319f73359f4d7a6dcc3` on `master`.

Qualify the actual CLI-installed RouterLink/Anchor composition in four production
applications: default/custom source layouts with root or `/recipe-base` paths.
Attach installed source, registry, styles, lock, production handler and configured
base/route source identities. Keep native SvelteKit request-relative SSR paths
enabled; the component does not rewrite URLs or introduce router state.

The sixty browser cases prove native attrs/classes/ref/children, cancellation,
pointer/Enter/Space behavior, query/fragment navigation, native history replacement
against a raw anchor, focus and scroll retention against a raw anchor, one caller
callback and one history entry, and real document reload versus retained client
state. Real server-load responses qualify hover data preloading and cache reuse;
real destination node-chunk requests qualify code preloading and reuse. Also
exercise explicit/default/empty rel changes, popup safety, named context reuse,
external navigation through owned synthetic responses, downloads with exact
bytes, aria-disabled semantics, teardown/remount, all Anchor source visual hooks,
theme/RTL/reduced motion and concurrent isolated SSR responses.

Initial browser run: 56 passed, four failed on an incorrect test expectation that
raw Svelte boolean attributes serialize as `"true"`. Raw anchor shorthand emits
`""`; forwarded boolean props emit `"true"`, both valid native option values.
Correct only each raw-control attribute expectation; retain exact focus and scroll
assertions and rerun all sixty cases. No product changes, skips, suppressed browser
errors or accessibility exceptions.

README documents optional recipe installation, transitive Anchor/tokens design,
application-owned resolve/asset, base paths, native options/current-page attrs,
target rel defaults and separate Button action composition. Source manifest,
component runtime, types, CSS and token metadata remain unchanged.

Verification through the configured build router:

- Exact Chromium RouterLink file: final60/60 across all four installations.
- Maintained fixture check/build and exact token projections: exit0; Svelte
  check reports zero errors/warnings.
- Typecheck, lint, format and governing contracts: exit0.
- Source/staged diff and whitespace review pass. Cargo N/A; no Rust affected.

Worker launch retains the previously observed NO_COLOR/FORCE_COLOR environment
warning; actual browser page errors, console errors, hydration warnings, owned
server errors and exit failures remain strict. No full-suite, cross-platform,
complete-MVP or independent acceptance is claimed.

No blocker. Continue original S155 only after this green commit; mandatory
separate S181 review gates S182 and independently assesses the earlier S150 lint
scope and S152 native type repair. Preserve original criteria, reference source
and repository boundaries; no push/publication/deployment.
