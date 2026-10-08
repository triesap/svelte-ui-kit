# S149 step report — Freeze Anchor props and semantic mapping

Author: Codex. Locally verified candidate; independent S181 sequence acceptance pending.
Implementation commit: `3fccd821faa50e99c3696593b21971ee451afbff`.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S149","kind":"report","commit":"3fccd821faa50e99c3696593b21971ee451afbff","disposition":"candidate"}
-->

Original R03, R20, R22, R26, R32, R33, R34. Starting
`cc962f83d5706e06bab0b7da3d55fbf798765b46` on `master`, after independently
accepted S148 at `bd2613c050c37cd883d4e2155a6eb264ce66c484`.

Inspected the immutable native Anchor source, manifest and complete stylesheet.
Freeze Anchor/AnchorProps/AnchorTarget, required source href and Snippet children,
actual HTMLAnchorElement ref, exact native target alias and other Svelte anchor
attrs/events. The source blank-target rel default remains render-time behavior;
explicit caller rel, including empty, survives. No kit disabled/variant/as/child
API, routing engine, synthesized role or button keyboard behavior is introduced.
Native download's upstream permissive typing is preserved explicitly.

The map records exact source/style/export cohort, targets, tokens-only registry
dependency, no npm primitive dependency, classes, all nine source CSS hooks,
navigation/cancellation/form semantics and SSR/hydration obligations. Source
implementation/registration and actual browser qualification remain S150/S151.

Changed files: `registry/ui/anchor.types.ts`,
`specs/component-maps/anchor.md`, `tests/components/anchor-types.test.ts` and this
report. The dedicated public type file exposes the adapted native alias,
source-required props and deliberate ref/snippet contract for generated apps.

Verification through the configured build router:

- `node tools/run-unit-tests.mjs --suite components tests/components/anchor-types.test.ts`:
  14/14; strict native positive and thirteen causal negative fixtures, with no
  skips/TODOs/cancellations or unrelated declaration diagnostics.
- `pnpm run fixture:check`: exit0, zero Svelte errors/warnings.
- `pnpm run typecheck`, `pnpm run lint`, `pnpm run format:check`: exit0.
- `pnpm run check:contracts`: exit0, zero errors/warnings.
- Author/staged diff and whitespace review pass. No affected Rust workspace;
  Cargo N/A. No browser/build claim for this API-only checkpoint.

No blocker. Independent acceptance is pending the original S181 gate; continue
only to original S150 after this green commit. Reference sources and original
criteria remain unchanged; no push/publication/deployment.
