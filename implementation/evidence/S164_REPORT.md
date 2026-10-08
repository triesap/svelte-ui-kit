# S164 step report — Freeze native Alert message semantics

Author: Codex. Independently accepted on code `a79db79f78818797e2b3d541731797b5b19b60ce` at evidence `871c1945daf660d9f0f724fb949057b4fa3a1da6`.
Original implementation commit: `880f09fa5181dcb71330b55dbfe47d9f7a956254`. The candidate narrative below
is historical implementation and verification provenance.
Implementation commit: `880f09fa5181dcb71330b55dbfe47d9f7a956254`.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S164","kind":"report","commit":"871c1945daf660d9f0f724fb949057b4fa3a1da6","disposition":"implemented"}
-->

Original R03, R20, R22, R26, R32, R33, R34.
Starting `b6076e9bc0174c5efa0071f7ba083bb3978975c6` on `master`.

Inspect actual immutable Alert source, manifest and all six CSS declarations.
Freeze one native div with fixed alert role, caller class and required children;
source defaults imply assertive/atomic live-region semantics, and source guidance
uses Status for non-urgent dynamic content. No severity/size variants, compound
parts, icons, dismiss/timer/queue, delivery callbacks, dialog dependency or
application announcement engine are source-supported.

Freeze Alert/AlertProps, two flat source targets, one source/style cohort and
tokens-only dependency. Intersect actual Svelte div attributes with compatible
required children Snippet, bindable HTMLDivElement ref and optional source-matching
role literal. Contradictory roles fail rather than being accepted/dropped. Native
styles/attrs/events/naming/ARIA stay native. Explicit actual aria-live/atomic values
can intentionally change their native defaults; retain and document caller
ownership rather than inventing unions/options or silently rewriting input.
Record meaningful content, optional native labels, decorative duplicate exclusion,
retained update/ref identity, request-local SSR and absence of focus/action or
notification behavior. Preserve all source surface rules and existing radius/
semantic metadata; append no guessed variants or hooks.

Verification through the configured build router: strict actual-Svelte native
types19/19 (one positive and eighteen causal negative fixtures); maintained fixture
check/exact projections, typecheck, lint, format and governing contracts exit0.
Svelte check reports zero errors/warnings; no dependency skipLibCheck or mocked
native declarations. Source/staged diff and whitespace review pass. Cargo N/A;
no Rust affected.

Changed native types, complete public source/target worksheet, owning fixtures,
predecessor bookkeeping and this report. Item remains unregistered until S165;
no runtime/CSS/metadata/registry changes here. Actual role/live properties,
accessible tree/dynamic content, native ARIA overrides, decorative duplicates,
contrast, themes and SSR/hydration remain S165/S166. Accessibility-tree semantics
do not assert measured speech from every screen reader. No independent/platform/
MVP acceptance claim. No blocker; continue original S165 after this green commit;
separate S181 acceptance gates S182. Original definitions, reference source,
repository identity and unrelated changes remain intact. No push/publication/deployment.
