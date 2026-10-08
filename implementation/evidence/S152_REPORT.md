# S152 step report — Freeze the optional Router Link recipe

Author: Codex. Independently accepted on code `a79db79f78818797e2b3d541731797b5b19b60ce` at evidence `871c1945daf660d9f0f724fb949057b4fa3a1da6`.
Original implementation commit: `68d46280f572e551cc862163a3274bd56de75cad`. The candidate narrative below
is historical implementation and verification provenance.
Implementation commit: `68d46280f572e551cc862163a3274bd56de75cad`.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S152","kind":"report","commit":"871c1945daf660d9f0f724fb949057b4fa3a1da6","disposition":"implemented"}
-->

Original R03, R20, R26, R28, R32, R33, R34.
Starting `01baa6da87894397e1a22169a57158458c82fab6` on `master`.

Inspected immutable router_link.rs and router-link manifest: source Leptos A
supplies navigation, kit-anchor presentation, no independent stylesheet and an
Anchor dependency. Freeze optional RouterLink/RouterLinkProps, exact AnchorProps
alias, direct sibling reuse, real ref/snippet forwarding and no additional wrapper
element. Keep source style through Anchor; no duplicate CSS or route engine.
Application code owns active-link attrs/classes and href resolution.

Inspected pinned SvelteKit2.70.3 actual public declarations and server/client
resolve implementations. Internal URLs use caller resolve() with the configured
base; assets use asset(); external and native target/download URLs remain
unchanged. Record server-relative versus client-base behavior explicitly, pending
actual S154 production qualification. No router package/context/store or kit
navigation handler is introduced; the recipe remains unregistered until S153.

Native link options inherit the actual fresh SvelteKit HTMLAttributes augmentation.
The owning test synchronizes an owned consumer once, extracts its actual native
module augmentation without copying route/global/ambient runtime state, and
strictly compiles the frozen aliases with real Svelte types. Known invalid native
link options and invented recipe APIs are causal negatives, not annotation-only
expectations or a kit-maintained union copy.

Initial19case lane passed16: invalid preload-data/preload-code/keepfocus values
produced no diagnostic. Add an independent raw native-anchor control: it rejects
the same invalid augmentation value, while the alias still accepts it (17/20).
Mapped Omit erased known data-* constraints below the native template index
signature. Repair only Anchor's required-prop construction to intersect the
unchanged native interface; bump that registered source/type cohort to0.1.1 and
refresh registry provenance. The fresh combined37case lane passes, including all
original Anchor cases. Rendering, CSS, native required href/children/ref and other
public APIs remain unchanged. This necessary dependency repair is documented and
awaits separate S181 assessment; no self-acceptance is granted.

Changed: Router Link map/type/fixtures, Anchor type/manifest/map and registry
digest, predecessor bookkeeping and this report.

Fresh checks through the configured build router:

- Router Link owning types:20/20; combined Anchor/Router Link selection37/37,
  strict declarations, zero unrelated diagnostics/skips/TODOs/cancellations.
- Requalified registered Anchor install:3/3, actual default/custom CLI consumers
  check/build/production SSR/replay and exact source/lock identities.
- Full registry53/53 and real packed package3/3: exit0.
- Maintained fixture check and exact token projection: exit0, zero Svelte
  errors/warnings; owned generated native-augmentation fixture check also passes.
- Typecheck, lint, format and governing contracts: exit0.
- Source/staged diff and whitespace review pass. Cargo N/A; no affected Rust
  workspace. Browser base-path/link-options behavior remains S154.

No blocker. All original criteria and reference source remain intact. Continue
only to original S153 after this green commit; S181 independent acceptance gates
S182. No push/publication/deployment.
