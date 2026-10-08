# S142 step report — Native Collapsible disclosure candidates

Author: Codex. Independently accepted on code `aec5711b9d3368b1cc1f0416bca7f2f0ce5aa0a5` at evidence `bd2613c050c37cd883d4e2155a6eb264ce66c484`.
Original implementation commit: `2481d939dad27b3eda6c4da1569496082a9461c3`. The candidate narrative below
is historical implementation and verification provenance.
Implementation commit: `2481d939dad27b3eda6c4da1569496082a9461c3`.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S142","kind":"report","commit":"bd2613c050c37cd883d4e2155a6eb264ce66c484","disposition":"implemented"}
-->

Original R03, R20, R21, R32, R33, R34. Starting
`d9a0b505631a595f30ab8e044ce00978eda30d03` on `master`.

Thin Root/Trigger/Content candidates delegate actual Bits disclosure state,
refs, attributes/events/snippets and presence. Root binds open/ref; every part
merges source/caller classes and actual refs. Content keeps the source-scoped
hiddenUntilFound=false policy from S141 and native forceMount/open child props.
No additional accordion, transition, keyboard or identity machinery. Complete
parts remain unadvertised; S143 owns complete styled registration.

Real owned candidate app checks/builds and open/closed handler SSR preserve
expanded/hidden state, mounted children, source/caller classes and delegated
Root/Trigger/Content DOM with open snippet state. Actual source/route/package/
configuration and all production files are hashed; raw responses retain their
handler identity. Native candidate/raw triggers both omit controls before later
SSR Content registration; actual hydrated DOM links each to its own Content.

Real Chromium qualifies refs DIV/BUTTON/DIV/SECTION, pointer/Space/Enter binding
and state/completion callbacks, programmatic state without duplicate state
callback, bound-ref focus, native attributes/classes, caller cancellation and
disabled refusal. Default closed content retains its actual input node/state.
forceMount makes closed content visible with expanded=false/data-state=closed
for caller visual policy; toggling it restores native hidden state. Delegated
child receives actual open/props and hides/shows correctly, independent of the
main/raw instances. No unexpected console or hydration issue.

Verification through `cargo extbuild run --` after green doctor, Node24.21.0:

- `node tools/run-unit-tests.mjs --suite components tests/components/collapsible-types.test.ts tests/components/collapsible-parts.test.ts`: 17/17, exit0; exact positive/negative types and actual candidate check/build/two SSR responses.
- `pnpm exec playwright test --config playwright.config.ts tests/browser/collapsible-candidate.spec.ts`: 4/4 Chromium, exit0; real owned candidate production server with complete artifact provenance.
- `pnpm run fixture:check`, `pnpm run fixture:build`: exit0; maintained fixture zero errors/warnings and real Node-adapter output.
- `pnpm run typecheck`, `pnpm run lint`, `pnpm run format:check`, `pnpm run check:contracts`: exit0.
- `git diff --check`, staged diff review/check: exit0; conditional Cargo N/A.

Files: three native candidate parts, actual candidate builder/route/component/
browser fixtures, measured worksheet, this report and preceding S141 bookkeeping.
Logs: `implementation/evidence/logs/s142-*.log`, `logs/collapsible-candidate/`
and actual per-case artifacts. No failure, skip, blocker or scope deviation.
Original 203 definitions and prior accepted evidence remain intact. Continue
original S143 after the green commit; S144 still owns full installed interactions,
composed disclosure/motion/hydration/lifecycle evidence and separate S148
acceptance still gates S149. Full MVP remains open.
