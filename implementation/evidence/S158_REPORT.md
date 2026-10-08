# S158 step report — Freeze native Badge presentation

Author: Codex. Locally verified candidate; independent S181 acceptance pending.
Implementation commit: `eb468371733fe04426342d457ef417b6f9682797`.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S158","kind":"report","commit":"eb468371733fe04426342d457ef417b6f9682797","disposition":"candidate"}
-->

Original R03, R20, R22, R25, R26, R32, R33, R34.
Starting `080c7cdf4ff7fdf4fc2ee011767c9deeab23a750` on `master`.

Inspect actual immutable Badge source, manifest and all ten CSS declarations.
Freeze one native span with required children and caller class, exact Badge/
BadgeProps flat exports, two source targets, tokens-only dependency and one
compatible badge stylesheet. The source has no variant/size/action/status API;
do not infer new variants from available semantic tokens or another component.

Intersect the actual Svelte span type with compatible required Snippet children
and optional bindable HTMLSpanElement ref. Preserve native attrs, style, class,
data/ARIA and events. Record structural native DOM typing honestly rather than
inventing a nominal ref type, and qualify actual DOM identity in S160. Default
meaningful text is application-owned; no automatic live region, color-only status,
button/link behavior, replacement child or global state. Retain exact source
layout/font/foreground/background and existing radius customization metadata.
No extra hooks or dependencies are justified.

Verification through the configured build router: strict actual-Svelte native
types13/13 (one positive and twelve causal negative fixtures); maintained fixture
check/exact projections, typecheck, lint, format and governing contracts exit0.
Svelte check reports zero errors/warnings; no dependency skipLibCheck or mocked
native declarations. Source/staged diff and whitespace review pass. Cargo N/A;
no affected Rust workspace.

Changed native types, complete public source/target worksheet, owning fixtures,
predecessor bookkeeping and this report. Item remains unregistered until complete
S159; no runtime/CSS/metadata/registry changes or independent acceptance claim.
Actual source text/attrs/theme/focus/form/SSR rendering belongs to S159/S160.
No blocker; continue original S159 after this green commit; separate S181
acceptance gates S182. Preserve original criteria, reference source, repository
identity and parent index. No push/publication/deployment.
