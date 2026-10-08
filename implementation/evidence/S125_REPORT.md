# S125 step report — Menu source-required item composition

Author: Codex. Independently accepted on code `21c72d21fd78a34f12099b94b0d4fddff779d911` at evidence `f9dc56f1921024c426b8df59c0c08abb28e2af7c`.
Original implementation commit: `c02e65efcade4575012139fb0730cf0961acf934`. The candidate narrative below
is retained as historical implementation and verification provenance.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S125","kind":"report","commit":"f9dc56f1921024c426b8df59c0c08abb28e2af7c","disposition":"implemented"}
-->

Requirements R03, R20, R22, R26, R32, R33, R34. Starting `687e6c1`, branch
`master`. Item, RadioGroup and RadioItem wrap the actual pinned native parts,
bind actual refs, merge design/caller classes and forward both native rendering
hooks and selection/disabled/textValue/closeOnSelect behavior unchanged.
RadioGroup explicitly binds value with native empty-string default.
ItemIndicator is the frozen stateless native span: required checked boolean,
bound HTMLSpanElement ref, caller attrs/classes/events/children, owned hidden
and checked/unchecked data-state. Native RadioItem snippets supply checked;
no index store, duplicate selection machinery or invented optional parts.

The candidate-copy helper now builds all eight authored parts, no raw substitutes.
Its real generated application fixture checks default/delegated ordinary items,
bound controlled and default uncontrolled groups, default/delegated RadioItem
snippets and real visible/hidden indicator state. Full production hashes and
executed SSR handler identity are retained before assertions.

All commands ran from the repository root after green extbuild doctor through
`cargo extbuild run --`, with Node24.21.0/pnpm11.22.0/Svelte5.57.1/Bits2.19.3:

- `node tools/run-unit-tests.mjs --suite components tests/components/menu-items.test.ts tests/components/menu-types.test.ts`: 27/27, exit0. All-eight production compilation/SSR plus positive, 23 causal negative and exact native equality controls, and incomplete-family advertisement refusal.
- `pnpm exec playwright test --config playwright.config.ts tests/browser/menu-candidate.spec.ts`: final Chromium19/19, exit0. Prior14 plus all seven actual refs/classes/roles/delegated props, callback/binding/indicator agreement, parent value updates, canceled selection, native disabled refusal, uncontrolled native selection and default close.
- `pnpm run typecheck`, `pnpm run lint`, `pnpm run format:check`, `pnpm run fixture:check`, `pnpm run fixture:build`, `pnpm run check:contracts`: exit0. Maintained Svelte check zero errors/warnings and real Node-adapter build.
- `git diff --check` and staged check: exit0. All203 original definition blocks byte-identical to `a176387`.

Raw logs are `implementation/evidence/logs/s125-*.log`; actual copied application
check/build/full artifact inventories and SSR response under
`implementation/evidence/logs/menu-candidate/`. First browser run18/19 timed
out because Playwright refused pointer action on aria-disabled items. Final
case uses forced real pointer input to reach the native guard, and asserts no
selection/value/open change. No product or contract repair was required.

Self-review includes only scheduled parts/fixtures and predecessor bookkeeping.
No skipped tests, reference edits or parent index changes; Cargo N/A in this
TS-only target. Previously qualified upstream declaration/reference exceptions
remain AC20 debt. Candidate composition is not CLI installation acceptance:
S126 must register the full source/style/export cohort, S127 prove installed
keyboard/typeahead/nesting, and S128 placement/themes/CSP and separate review.

Commit subject: `menu: complete source-required item composition`; record actual
SHA after green commit. S126 is safe after that commit within the exact current
batch. S129 remains gated by independent S128 acceptance.
