# S189 implementation report — full catalog SSR and hydration

Author: Codex. Candidate; separate S193 acceptance remains required.
Implementation commit will be recorded after the green commit.

## Changes and evidence

Both actual default/custom CLI-installed 22-item catalogs are checked and built
as production SvelteKit consumers. Initial values vary across native Progress,
Field recipes, Checkbox, Switch, Radio, Tabs, Collapsible and Menu radio parts.
The fixtures render before onMount; no route disables SSR. Each checked/built
parent, child catalog and direct native Menu control is bound to artifact hashes.

The two integration cases each issue 13 concurrent then 13 repeated requests
against one owned production worker. Twelve catalog requests vary request text,
checked/selected/disclosure state, conditional second instances, initial open
Dialog/Alert/Menu and inline/body/custom portals. They verify real SSR markup
for every styled family, both link exports, native initial states, recipe
labels/descriptions, document ID uniqueness and request isolation. Native
client portals omit content in SSR; inline initial-open parts render their
actual roles. The final request renders direct pinned Bits Menu as a control.

Twenty-two browser cases hydrate the same real installed production artifacts
with strict lifecycle console/error/hydration capture. They verify initial
native states including null Progress and indeterminate Checkbox, SSR-to-client
Field ID stability, all live relationship targets, instance-local edits,
conditional destruction/recreation and complete catalog remount. Initial-open
Dialog/Alert/Menu cases verify actual portal placement, native modal names and
descriptions, Escape teardown and unaffected neighboring catalog state.

## Measured native boundary and corrections

An initial whole-document repeated-ID assertion exposed Bits 2.19.3 floating
positioning wrapper `wrapperId = useId()` using `globalThis.bitsIdCounter`.
The direct native Menu SSR control reproduces the differing nonsemantic wrapper
ID across repeated requests. Only IDs on actual
`data-bits-floating-content-wrapper` owners are compared separately. All
semantic native/Field IDs repeat for equivalent requests; uniqueness and every
emitted SSR relationship are still asserted for all IDs. No source patch,
SSR suppression, kit counter or identity API is introduced. The identity map
records this native boundary for independent S193 assessment, without claiming
request-local floating allocation or accepting a waiver. Initial diagnostic
logs remain retained.

Browser assertion corrections use the real native bridge ownership (names on
hidden form inputs, not buttons) and native Radio `data-value`; they do not
change product behavior. Every live relationship, including `aria-controls`,
must resolve. Initial focused success is retained separately from the final
strengthened run.

## Verification

All commands use the extbuild router after a green doctor with current guard.
Node 24.21.0, pnpm 11.22.0, pinned Svelte 5.57.1/Bits 2.19.3 and Chromium on
macOS arm64 are the measured environment.

- `node tools/run-unit-tests.mjs --suite integration tests/integration/catalog-ssr.test.ts`: 2/2 passed, zero skips; final log `logs/s189-integration-final.log` and `logs/catalog-ssr/` contain actual responses/artifact hashes.
- `pnpm exec playwright test --config playwright.config.ts tests/browser/catalog-hydration.spec.ts --max-failures=1 --output=implementation/evidence/logs/s189-browser-final-artifacts`: 22/22 passed, zero skips; final log `logs/s189-browser-final.log` and retained artifact/identity records.
- `pnpm run fixture:check` found zero errors/warnings; `pnpm run fixture:build` passed. Final `pnpm run typecheck`, `pnpm run lint`, `pnpm run format:check`, `pnpm run check:contracts`, `git diff --check` and staged diff review passed before this candidate commit.

The S188 full 685-case browser run remains the preceding full-suite evidence;
this slice reruns its new owning cases. Existing two pinned strict-declaration
exceptions and native boundaries remain explicit final AC20 obligations, not
claimed raw declaration success. No Rust changes: Cargo guards N/A. Reference
source, dependency pins, public product assets and parent index are untouched.
S190 becomes eligible only after this candidate is verified and committed;
separate S193 acceptance gates S194.
