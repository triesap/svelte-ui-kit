# S127 step report — installed Menu keyboard, selection and dismissal

Author: Codex. Candidate; mandatory separate S128 acceptance remains pending.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S127","kind":"report","commit":null,"disposition":"candidate"}
-->

Requirements R20, R22, R26, R29, R32, R33, R34. Starting `d67cc15` on
`master`. Real CLI-installed default/custom applications now qualify ordinary/
radio keyboard selection, roving navigation and loop, disabled skips, DOM-text
typeahead, focus return, outside/Escape dismissal, caller cancellation and
nested Menu inside Dialog. Public root imports and complete source/CSS/lock/
production hashes are captured before assertions. No product state, search,
focus or dismissal engine was added; native parts own these behaviors.

All commands ran from repository root via `cargo extbuild run --` after green
doctor, Node24.21.0/pnpm11.22.0/Svelte5.57.1/Bits2.19.3:

- `pnpm exec playwright test --config playwright.config.ts tests/browser/menu-keyboard.spec.ts`: final22/22 Chromium, exit0, eleven cases per layout. Real initial first-item focus, arrows/Home/End/loop, native text content typeahead, Enter/Space ordinary close, controlled radio value/callback/checked indicator, cancellation, forced pointer and keyboard disabled refusal, Escape/outside policies and two nested overlay focus restorations, RTL, plus direct pinned textValue controls.
- `node tools/run-unit-tests.mjs --suite components tests/components/menu-types.test.ts`:26/26, exit0, positive/negative/native equality/owned-unadvertised controls.
- `pnpm run typecheck`, `pnpm run lint`, `pnpm run format:check`, `pnpm run fixture:check`, `pnpm run fixture:build`, `pnpm run check:contracts`:exit0. Final lint/format/contracts rerun after probe edits; maintained Svelte zero errors/warnings and actual Node-adapter build.
- `git diff --check` and staged check:exit0.

Raw logs: `implementation/evidence/logs/s127-*.log`; actual generated checks/
full production artifact inventories under `logs/generated-consumer/`, browser
artifacts attached before assertions. Initial18/20 exposed pinned textValue
semantics: public prop exists, but native DOMTypeahead uses trimmed textContent
and Item forwards textValue as an attribute. Final candidate and direct raw
native controls both reject alias search and match actual visible-label search.
The worksheet records this exact limitation for independent review. Required
DOM-text typeahead remains proven; no criteria or API weakened and no invented
kit search machinery. Search experiments use fresh pages because the pinned
search buffer survives immediate close/reopen until its reset timer.

Intermediate19/22 and20/22 runs exposed test ordering: keys raced native
opening focus and alias/content-text experiments shared buffered search. Final
fixture waits for actual first-item focus and isolates each search experiment.
The initial format check also caught the in-flight probe edit; final explicit
format check passes. Failures remain retained rather than claimed green.

Self-review includes only installed qualification routes/tests, factual native
mapping and predecessor bookkeeping. No tests skipped, reference edits, parent
index or remote changes. Cargo N/A in TS-only target. Existing declaration/
reference exceptions remain AC20 debt. Placement/themes/CSP/request identity/
dynamic cleanup remain S128 work and no independent acceptance is claimed.

Commit subject: `test: qualify menu keyboard selection and dismissal`; record
actual SHA after commit. S128 safe after this green candidate; S129 requires the
separate independent RCLD-07 gate.
