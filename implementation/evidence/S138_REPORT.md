# S138 step report — Native Tabs Trigger and Content candidates

Author: Codex. Locally verified candidate; independent S148 acceptance pending.
Implementation commit: `27d84f097ea94a1a62cf6d3ca2d68dbf93ff7710`.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S138","kind":"report","commit":"27d84f097ea94a1a62cf6d3ca2d68dbf93ff7710","disposition":"candidate"}
-->

Original R20, R21, R22, R32, R33, R34. Starting
`902933058ddc403018d3fc6e8e6f1a73adce79ac` on `master`.

Thin Trigger and Content preserve actual pinned value/disabled/refs/snippets,
native attributes and handlers. Caller classes merge with kit-tabs-trigger and
source kit-tabs-panel. Content keeps native always-mounted hidden DOM; no
presence prop or keyboard/identity engine. The candidate builder retains the
S137 Root/List-with-raw-parts lane and adds a separately identified complete
four-part candidate with default and delegated renderers plus a raw Bits group.
All actual app source and production identities/check/build logs are retained.

Complete candidate A/B/empty SSR preserves selected triggers, hidden panels,
button type, source/caller classes, mounted children and delegated button/section
markup. Direct raw Bits SSR reproduces omitted pre-registration relationships.
Fresh actual Chromium measures reciprocal aria-controls/aria-labelledby in all
default/delegated/raw groups after hydration, and refs BUTTON/DIV/BUTTON/SECTION.
Both snippet forms, handlers/classes/data and delegated hidden policy remain.

Actual panel input node stays connected and retains entered state while hidden,
then reappears unchanged after native selection. Programmatic bound value emits
no extra selection callback. Manual click preventDefault preserves previous
selection with caller callback ordering; Enter activates and disabled trigger
refuses interaction. All preceding Root/List native-option cases remain green.
This is local implementation evidence; separate S148 acceptance is still required.

Verification through `cargo extbuild run --` after green doctor, Node24.21.0:

- `node tools/run-unit-tests.mjs --suite components tests/components/tabs-parts.test.ts tests/components/tabs-types.test.ts tests/components/tabs-root-list.test.ts`: 18/18, exit0; exact types and both real candidate check/build/SSR lanes.
- `pnpm exec playwright test --config playwright.config.ts tests/browser/tabs-parts.spec.ts tests/browser/tabs-candidate.spec.ts`: 5/5 Chromium, exit0; real owned production handlers and complete artifact provenance.
- `pnpm run fixture:check`, `pnpm run fixture:build`: exit0; maintained fixture zero errors/warnings and real Node-adapter output.
- `pnpm run typecheck`, `pnpm run lint`, `pnpm run format:check`, `pnpm run check:contracts`: exit0.
- `git diff --check`, staged diff review/check: exit0; conditional Cargo N/A.

Files: Trigger/Content wrappers, complete candidate route/component/browser
fixtures, shared candidate builder's explicit complete mode, measured worksheet,
this report and preceding S137 bookkeeping. Logs:
`implementation/evidence/logs/s138-*.log`, `logs/tabs-candidate/` and actual
per-case artifacts. No failure, skip, blocker or scope deviation. Original 203
definitions and prior accepted criteria remain intact. Continue S139 complete
styled registration after this green commit. Full MVP remains open.
