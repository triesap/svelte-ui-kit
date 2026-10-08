# S173 step report — Freeze native Separator orientation and decoration

Author: Codex. Independently accepted on code `a79db79f78818797e2b3d541731797b5b19b60ce` at evidence `871c1945daf660d9f0f724fb949057b4fa3a1da6`.
Original implementation commit: `47dc157fb1a06762c0af2a6dd688ae280faca0a1`. The candidate narrative below
is historical implementation and verification provenance.
Implementation commit: `47dc157fb1a06762c0af2a6dd688ae280faca0a1`.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S173","kind":"report","commit":"871c1945daf660d9f0f724fb949057b4fa3a1da6","disposition":"implemented"}
-->

Original R03, R20, R22, R26, R32, R33, R34.
Starting `3a69123effc6b8d9b4640b72cec6f11ee01f114d` on `master`.

Inspect immutable source empty div/separator role, horizontal/vertical orientation
union/default horizontal, coupled ARIA/data orientation, source manifest and six
CSS declarations. Freeze native semantic div, Separator/SeparatorProps/typed
SeparatorOrientation, two flat source targets, one source/style cohort, tokens-only
registry dependency and no npm dependency. Approved catalog also requires a
bounded decorative boolean: role none/aria-hidden true, omitted ARIA orientation
and retained visual data orientation. No message, extra node or announcement.

Intersect actual Svelte div attributes with exact source orientation and actual
bindable HTMLDivElement ref, no children, and owned ARIA/data orientation. A
meaningful/decorative discriminant permits only matching role and decorative
hidden choices; contradictory native values fail rather than being accepted
then discarded. Native caller class/style/attrs/naming/hidden/tabindex/events
otherwise remain native, without Omit widening data constraints. No splitter/
resizing/value state, keyboard actions/automatic focus, parts/variants/size or
polymorphism. Record synchronized dynamic orientation/decoration/node/ref,
cleanup and request-local SSR. Vertical percentage sizing requires an application
ancestor with definite height; no guessed wrappers, hook, radius or animation.
Preserve all six source CSS declarations and existing semantic metadata.

Verification through the configured build router: strict actual native types20/20,
maintained fixture check/exact projections, typecheck, lint, format and governing
contracts exit0. Svelte check zero errors/warnings; no skipLibCheck/mocked native
declarations. Source/staged diff and whitespace review pass. Cargo N/A; no Rust.

Changed complete source/target worksheet, bounded actual native/discriminated
props, positive/causal negative fixtures, actual predecessor bookkeeping and
report. Item remains unregistered until S174. No browser/full-platform/MVP or
independent acceptance claim. No blocker; continue original S174 after green
commit; separate S181 gates S182. Standalone source boundaries and unrelated work
remain intact. No push/publication/deployment.
