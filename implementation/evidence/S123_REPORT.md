# S123 step report — Menu Root and Trigger

Author: Codex. Locally verified candidate; independent S128 acceptance pending.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S123","kind":"report","commit":null,"disposition":"candidate"}
-->

## Implementation

Requirements R03, R20, R26, R32, R33, R34. Starting code `a01d348` on
`master`; preserved the existing unverified Root/Trigger and candidate fixture.
Root aliases the pinned DropdownMenu contract, explicitly binds open with false
initial default and forwards native snippets/change/completion/direction. Trigger
binds its actual HTMLElement ref, defaults type to button, merges caller classes
and forwards native props/events. Neither part recreates state, IDs or keyboard
machinery. The family remains unadvertised until S126.

The owned candidate-copy helper copies exactly Root, Trigger and types; remaining
Content/Item are raw Bits parts. Actual SvelteKit check/build, complete production
file hashes, executed handler identity and SSR responses are retained. The fixture
includes controlled, uncontrolled, delegated and initially open direct-native
compositions. This is candidate verification, not installed-family acceptance.

## Verification

All commands ran from the repository root, through `cargo extbuild run --` after
a green `cargo extbuild doctor`, with Node 24.21.0/pnpm 11.22.0 and pinned
Svelte 5.57.1/Bits 2.19.3. Commands and results:

- `node tools/run-unit-tests.mjs --suite components tests/components/menu-state.test.ts tests/components/menu-types.test.ts`: 27/27, exit 0.
- `node tools/run-unit-tests.mjs --suite components tests/components/menu-state.test.ts`: final stronger SSR presence assertions 1/1, exit 0.
- `pnpm exec playwright test --config playwright.config.ts tests/browser/menu-candidate.spec.ts`: Chromium 8/8, exit 0; real pointer/Enter/Space/ArrowDown activation, cancellation, disabled refusal, bound refs/attrs/classes, parent updates, uncontrolled and delegated selection close, initially open hydration.
- `pnpm run typecheck`, `pnpm run lint`, `pnpm run format:check`: exit 0.
- `pnpm run fixture:check`, `pnpm run fixture:build`: exit 0; zero Svelte errors/warnings, actual Node-adapter production build.
- `pnpm run check:contracts`: exit 0; projection and original authority consistent.
- `git diff --check` and staged diff check: exit 0.

Raw logs are `implementation/evidence/logs/s123-*.log`; owned application
check/build and final open/closed responses with production hashes are under
`implementation/evidence/logs/menu-candidate/`. Browser artifact inventories are
attached before assertions. The initial authored SSR regex assumed attribute
order and could compare two false values; final assertions use independent
lookaheads and require expected presence separately for candidate and raw native.
No production repair or requirement relaxation was needed.

Self-review confirms only scheduled candidate files and predecessor bookkeeping
are included. No reference edits or package advertising occurred. Cargo is N/A:
this is the TS-only target with no affected Rust workspace. No tests were skipped.
Existing qualified upstream TS2590 and unchanged-reference exceptions remain
AC20 debt, not new passes. Later selection/placement/themes/CSP and complete
installed-output acceptance remain S124–S128 responsibilities.

## Commit and next action

Commit subject: `menu: forward primitive state and activation`. Record the actual
SHA after commit; do not self-accept this candidate. S124 is safe after this green
commit under the existing exact RCLD-07 batch; S129 requires independent S128
acceptance. All original S001–S203 definitions remain unchanged.
