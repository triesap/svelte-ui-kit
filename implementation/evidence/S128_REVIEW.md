# S128 independent review — Menu floating, themes and CSP

Reviewer: separate Codex acceptance reviewer; no product implementation authored
for this batch. Date: 2026-10-08. Disposition: accepted against the original
S128 criteria, as part of the complete independent RCLD-07 gate.

Reviewed code: `21c72d21fd78a34f12099b94b0d4fddff779d911`. Frozen bookkeeping
boundary: `5383b84c364974e92ab60b6679e62221ad77da48`. Acceptance evidence is
plain until its real Git anchor is committed; this document invents no anchor.

Installed default/custom apps qualify viewport flips/collision padding, ancestor-scroll tracking, actual custom hosts, open/closed portal hydration, request/instance identity, live document/nested themes, clipping caveats and dynamic candidate cleanup. Real observer instrumentation plus an owned application missing-cleanup mutation proves teardown detection. Actual nonce/self-stylesheet CSP captures prehydration and hydrated policies/geometry/diagnostics without stripping native runtime styles.

Relevant independently executed probes: menu-placement.spec.ts; menu-csp.spec.ts; menu-lifecycle.spec.ts; menu-ssr.test.ts. The complete gate passed
134 Chromium browser cases, 52 component cases and 12 integration cases with
zero failures or skipped tests. Actual generated-app check/build/render and
raw native controls are included, rather than author reports or inventories
alone. Independent typecheck, lint, formatting and contract checks exited 0.
See [RCLD-07 qualification](RCLD-07_QUALIFICATION.md) for exact invocation,
retained raw evidence and original-contract limits.

No blocking finding or repair requested. Original S116–S128 definitions remain
unchanged against `a176387`; no dependency, criterion or review gate was waived.
This accepts this checkpoint's original scope, not later release, platform,
remaining catalog or AC20 obligations. Only the coordinator may commit this
plain evidence and finalize the real anchored acceptance transition.
