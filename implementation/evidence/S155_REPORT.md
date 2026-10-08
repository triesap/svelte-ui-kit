# S155 step report — Freeze Avatar native image and fallback contract

Author: Codex. Locally verified candidate; independent S181 acceptance pending.
Implementation commit will be recorded after the green commit.

Original R03, R20, R22, R25, R26, R32, R33, R34.
Starting `53b2c0e04ccbb5000f31a8482165feb77b5ddcd0` on `master`.

Inspect the immutable source native image, avatar manifest and all six CSS
declarations. Freeze its required src/alt, caller class, 2.5rem square, cover fit
and radius customization, with no invented source variant/loading/fallback API.
Apply the explicitly approved target Avatar fallback clarification as one optional
Snippet. Native image selection/events require no Bits preloader, package
dependency, compound catalog, delay or runtime request engine.

Record exact Avatar/AvatarProps exports and two flat source targets, tokens-only
dependency and one compatible avatar CSS block. Intersect the actual native img
type with compatible required src/alt and bindable image ref; retain native
attributes, responsive request hints and events. Specify instance/request-local
loading/loaded/error, current request reset and stale-event rejection, cached
hydration, caller callback ordering, image/fallback visibility, meaningful and
decorative naming, native caller attributes and the bounded target surface hooks.
Runtime generation and transitions remain owning S156/S157 work.

Initial positive fixture wrongly assumed native load/error currentTarget was
HTMLImageElement: actual pinned Svelte types expose Element. Initial14/15 passes.
Correct the fixture to retain that native type and explicitly narrow when using
image properties; do not replace or weaken the public native type. Final15/15
strict isolated actual-Svelte fixtures, with fourteen causal negative cases and
no dependency skipLibCheck, mocked declarations or unrelated diagnostics.

Verification through the configured build router: owning types15/15; maintained
fixture check/exact token projections, typecheck, lint, formatting and governing
contracts exit0. Fixture check reports zero Svelte errors/warnings. Source/staged
diff and whitespace review pass. Cargo N/A; no affected Rust workspace.

Changed native type, public source/target worksheet, owning fixtures, predecessor
bookkeeping and this report. Item remains unregistered until complete S156;
no source CSS/token metadata/registry changes here. No browser/runtime or
independent acceptance claim. No blocker; continue original S156 after this green
commit. Separate S181 acceptance remains mandatory before S182. No reference
mutation, push, publication or deployment.
