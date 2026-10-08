# S183 implementation report — shared bindings, refs and delegation

Author: Codex. Implemented candidate; separate S193 acceptance remains required.
Implementation commit will be recorded after the green commit.

## Implementation and observations

`tests/fixtures/qualification/wrapper-contracts/+page.svelte` composes all 60
public component values from a real complete catalog installation. Its two
typed branches exercise ordinary and getter/setter forms for all 69 advertised
bindings: 53 DOM refs and 16 state props. `buildWrapperConsumer` in the existing
generated-consumer helper installs all 22 items in owned default/custom apps,
then checks and builds the actual source. It retains installed sources,
metadata, lock, CSS, application and production artifact digests.

`tests/browser/wrapper-contracts.spec.ts` verifies parent updates and actual
child interactions for Checkbox checked/indeterminate, Switch checked, Radio,
Tabs and Menu radio values, all six Field values, and Collapsible, Dialog,
Alert Dialog and Menu open. It observes every actual ref and verifies every
getter/setter callback with distinct prop counters. Conditional destruction
clears all refs, and remounting restores actual controls. Caller cancellation
runs before native Switch activation, preserving the bound state; a subsequent
uncancelled interaction updates it once. Actual Menu selection preserves the
advertised close-on-select policy.

Native child/children snippets remain rendered, including Menu radio checked
state. Delegated floating content spreads positioning `wrapperProps` onto a
distinct outer node and content props onto its inner menu. The actual wrapper
marker, CSS variables, computed positioning and inner menu role are measured;
positioning matches a separately composed direct native Bits control. No copied
positioning engine or fixed-position promise is introduced.

`tests/components/wrapper-contracts.test.ts` uses actual pinned native/Bits
types under strict TypeScript checking. Positive state/ref/callback/snippet
contracts pass. Twelve causal negatives reject owned or forbidden hooks,
discarded Field rendering, flattened floating wrapper shape, lost radio/open
snippet state and foreign native refs. These diagnostics must belong to the
actual caller fixture; upstream or unrelated diagnostic failures are rejected.

Qualification-only corrections preserved product contracts. Initial fixtures
wrongly used an Avatar string fallback and DOM attrs on non-DOM roots/portals;
the actual checker rejected them. The fixture now uses a fallback snippet and
proper native attributes. Reactive counter reads inside native binding effects
caused an observed update-depth error; counters now use untracked bookkeeping,
with strict lifecycle collectors still active. A guessed fixed-position check
was replaced by actual native comparison. The final hook correction satisfies
lint and has its own fresh browser verification. No product repair was needed.

## Verification

All final owning commands used the configured build router and exited 0:

- `node tools/run-unit-tests.mjs --suite components tests/components/wrapper-contracts.test.ts`: 13/13.
- `pnpm exec playwright test --config playwright.config.ts tests/browser/wrapper-contracts.spec.ts`: 8/8, both layouts and binding modes.
- The final artifact hook edit was reverified by the four cancellation cases: 4/4.
- `pnpm run fixture:check`: zero errors and warnings; `pnpm run fixture:build`: passed.
- `pnpm run format:check`, `pnpm run lint`, `pnpm run typecheck`: passed.
- `node tools/check-contracts.mjs`, diff whitespace and staged content review: passed before commit.

The full `node tools/run-unit-tests.mjs --suite components` lane also passed
440/440, with zero failed, skipped, cancelled or TODO cases, including all 17
strict-declaration qualification and causal-control cases.
Owning raw logs use `s183-`; final browser artifacts and installed digests are
retained in `implementation/evidence/logs/s183-browser-final-artifacts/` and
`s183-hook-browser-artifacts/`. Earlier failed fixture evidence remains distinct.
Rust checks are N/A: no Rust workspace is affected. Qualified pinned upstream
strict-declaration exceptions and final platform/package/AC20 obligations remain
explicit; no error collector, type or original criterion was weakened.

Next original checkpoint is S184, combined native forms and reset behavior.
S183 is author-verified and awaits separate S193 acceptance.
