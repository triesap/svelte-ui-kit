# S140 step report — Installed Tabs activation, teardown and hydration

Author: Codex. Locally verified candidate; independent S148 acceptance pending.
Implementation commit will be recorded after the green commit.

Original R20, R21, R22, R29, R32, R33, R34. Starting
`f0c49aa4afe1feea9012c73eb2b188c9c6ec7c19` on `master`.

Actual default/custom CLI consumers qualify automatic horizontal arrows/Home/
End, disabled skipping, clamp/wrap, manual focus-before-Enter/Space activation,
RTL and vertical navigation. Programmatic ref focus follows automatic native
selection. Caller classes/attributes, Root/List/Trigger/Content refs, binding,
callback ordering, manual click cancellation and disabled refusal remain exact.
Disabled main Root does not disable independent groups. Native type=button
triggers activate without submitting the actual surrounding form.

Hidden inactive panels retain their actual connected input node and entered
state; selecting the panel shows the same node/state. Root string selection
remains authoritative when selected C Trigger or Content is removed. Actual
bound refs clear on each destruction, opposite relationship disappears, and
remount restores exact reciprocal links. Live enabled navigation includes the
new C once without stale registration. Default, delegated button/section and
raw Bits groups link to their own panels and select independently.

Twelve concurrent actual same-worker SSR responses per installed layout cover
A/B/C/empty values, selected/hidden semantics, unique IDs and independent
secondary groups. All four initial values then hydrate with the corresponding
panel visibility and zero selection callbacks. Two repeated groups without
caller IDs preserve their actual generated IDs from SSR through hydration and
native reciprocal links; changing one group leaves the other/main group intact.
Actual server bodies, source/CSS/lock and complete handler/build identities are
retained. Native pre-registration SSR linkage boundary from S137/S138 remains
explicit; no parallel keyboard/ID engine or self-acceptance is introduced.

Verification through `cargo extbuild run --` after green doctor, Node24.21.0:

- `pnpm exec playwright test --config playwright.config.ts tests/browser/tabs.spec.ts tests/browser/tabs-styles.spec.ts`: fresh final 20/20 Chromium, exit0; 16 installed behavior/SSR/hydration cases and four preserved source-style cases. Initial 20/20 was also green; added hydration of every initial value and reran the complete lane fresh.
- `node tools/run-unit-tests.mjs --suite components tests/components/tabs-types.test.ts`: 16/16, exit0; actual pinned positive/negative types.
- `pnpm run fixture:check`, `pnpm run fixture:build`: exit0; maintained consumer zero errors/warnings and real Node-adapter output.
- `pnpm run typecheck`, `pnpm run lint`, `pnpm run format:check`, `pnpm run check:contracts`: exit0.
- `git diff --check`, staged diff review/check: exit0; conditional Cargo N/A.

Files: installed Tabs browser suite, actual qualification route with dynamic
parts/repeated groups/form boundary, measured worksheet, this report and
preceding S139 checkpoint/projection/report bookkeeping. Logs:
`implementation/evidence/logs/s140-*.log`, generated-consumer check/build logs,
per-case installed inventories, concurrent SSR and native identity artifacts.
No failure, skip, ignored issue, blocker or scope deviation. Original 203
definitions, accepted evidence, parent index and reference remain preserved.
Continue original S141 Collapsible freeze after the green commit; separate S148
acceptance still gates S149 and full MVP acceptance remains open.
