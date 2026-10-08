# S137 step report — Native Tabs Root and List candidates

Author: Codex. Locally verified candidate; independent S148 acceptance pending.
Implementation commit will be recorded after the green commit.

Original R03, R20, R21, R32, R33, R34. Starting
`23bcfaaa3dad6a0e43557b8e4536bb28bfaf38e8` on `master`.

Thin Root delegates value/ref and native options to Bits Tabs.Root; thin List
delegates its ref and grouping to Bits Tabs.List. Both merge kit/caller classes
and forward children/child, attributes and handlers. No selection, keyboard or
identity engine. Candidate route composes only these two authored parts with
raw native Trigger/Content, including separate delegated section/nav renderers.
The installed registry remains unadvertised; complete original S139 still owns
registration.

Actual owned app checks/builds and handler SSR for A/B/empty preserve selected
triggers, always-mounted hidden panels, child content, classes, native list
orientation and independent delegated group B. Source/route/package/config and
all 114 production files are hashed (120 total artifact files). Actual SSR
omits aria-controls/aria-labelledby before native registration effects; actual
hydrated DOM has exact panel/trigger links. The worksheet and raw responses
record that native lifecycle boundary without inventing a second ID registry
or claiming server-side links from browser evidence.

Real candidate Chromium qualifies value binding/callbacks, refs DIV/DIV/SECTION,
caller classes/data, actual native list labeling, both snippet forms and panel
visibility. RTL, explicit clamp, vertical orientation, manual focus-before-Space,
group disabled refusal, raw disabled trigger and native default delegated loop
all pass without another keyboard implementation. No failure or console issue.

Verification through `cargo extbuild run --` after green doctor, Node24.21.0:

- `node tools/run-unit-tests.mjs --suite components tests/components/tabs-root-list.test.ts`: 1/1, exit0; actual candidate check/build, three actual SSR responses and full artifact provenance.
- `pnpm exec playwright test --config playwright.config.ts tests/browser/tabs-candidate.spec.ts`: 2/2 Chromium, exit0; real candidate check/build and owned production server.
- `pnpm run fixture:check`, `pnpm run fixture:build`: exit0; maintained fixture zero errors/warnings and real Node-adapter output.
- `pnpm run typecheck`, `pnpm run lint`, `pnpm run format:check`, `pnpm run check:contracts`: exit0.
- `git diff --check`, staged diff review/check: exit0; conditional Cargo N/A.

Files: Root/List candidates, candidate builder/route/component/browser fixtures,
measured Tabs worksheet, this report and preceding S136 bookkeeping. Logs:
`implementation/evidence/logs/s137-*.log`, `logs/tabs-candidate/` and actual
per-case artifact attachments. No remaining failure, skipped check, blocker or
scope deviation. Original 203 definitions and accepted evidence are preserved.
Continue S138 Trigger/Content after this green commit; separate S148 acceptance
and full MVP acceptance remain open.
