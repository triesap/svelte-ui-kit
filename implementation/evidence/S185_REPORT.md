# S185 implementation report — cross-family overlay composition

Author: Codex. Implemented candidate; separate S193 acceptance remains required.
Implementation commit: `232fc6e27c7fdd2848a926c95879aa296daf3097`.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S185","kind":"report","commit":"232fc6e27c7fdd2848a926c95879aa296daf3097","disposition":"candidate"}
-->

## Implementation and observed behavior

`tests/fixtures/qualification/overlay-composition/+page.svelte` uses actual
Dialog, Alert Dialog and Menu compound parts in three compositions: Menu in
Dialog, Menu in Alert Dialog, and Menu in an Alert Dialog nested in Dialog.
The existing generated-consumer helper installs complete real items in owned
default/custom applications, checks/builds both and records installed source,
metadata, CSS, application and production digests.

`tests/browser/overlay-composition.spec.ts` measures actual native layers and
live focus. Escape dismisses only the topmost Menu and returns to its trigger;
parent layers remain open. Subsequent Escapes traverse the Alert Dialog/Dialog
chain and restore focus to each intended live trigger. An outside interaction
within the parent dismisses Menu while preserving parent ownership. Dialog
outside dismissal and Alert Dialog outside-ignore remain distinct. Native Alert
Action does not automatically close; Cancel closes and restores the correct
containing trigger, including the nested modal composition.

Three interrupted parent presence cycles per composition/layout prove that
rapid close/reopen and final Escape release all content, refs and native layers.
Whole root destruction removes open portalled content and disconnects the old
trigger; remount creates a usable live trigger and working Menu focus return.
The application explicitly clears its own bound flags when it requests a burst
or root destruction. No kit state clone, focus stack, global layer manager,
behavioral alias or product repair was introduced.

## Verification

All owning commands used the configured build router and exited 0:

- `pnpm exec playwright test --config playwright.config.ts tests/browser/overlay-composition.spec.ts`: 18/18 across three compositions and both installed layouts; strict lifecycle collectors report zero issues.
- The final evidence-hook lint edit was reverified with the two Dialog Escape cases: 2/2.
- `pnpm run fixture:check`: zero errors and warnings; `pnpm run fixture:build`: passed.
- `pnpm run format:check`, `pnpm run lint`, `pnpm run typecheck`: passed.
- `node tools/check-contracts.mjs`, diff whitespace and staged content review: passed before commit.

Raw owning logs use `s185-`; real consumer digests and browser artifacts are
retained in `implementation/evidence/logs/s185-browser-initial-artifacts/` and
`s185-hook-browser-artifacts/`. Qualification is Chromium and the pinned native
primitive composition, not arbitrary cross-framework layer interoperability.
Rust checks are N/A: no Rust workspace is affected. Earlier native reset, CSP,
strict-declaration and final platform/package/AC20 bounds remain explicit. No
original checkpoint criterion or dependency was changed.

Next original checkpoint is S186, complete CSS/property/selector coverage.
S185 awaits the mandatory separate S193 acceptance gate.
