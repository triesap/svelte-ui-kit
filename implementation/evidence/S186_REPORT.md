# S186 implementation report — complete catalog CSS contracts

Author: Codex. Independently accepted on code `abeccabbdfda5aedb7be4f72e3b51a4675d3a609` at evidence `8ab760dc4d674853b172126b2a3ec3a0434c678f`.
Original implementation commit: `7ce4e06c86967157fa7b572975a5e4f24dd27c8d`. The candidate narrative below
is historical implementation and verification provenance.
Implementation commit: `7ce4e06c86967157fa7b572975a5e4f24dd27c8d`.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S186","kind":"report","commit":"8ab760dc4d674853b172126b2a3ec3a0434c678f","disposition":"implemented"}
-->

## Implementation and observed behavior

The parsed CSS inventory follows every actual registry manifest stylesheet.
Three registry cases prove all 278 public customization properties have parsed
declaration uses; every class targets wrapper markup, the six native Button
variant/size classes, or the documented caller-owned Menu radio label snippet;
and the 21 authoritative stylesheets have unique ownership. Generated wrappers
contain no competing component style block/import or Tailwind/CSS-in-JS pipeline.
Declared private motion variables and the four original optional ghost color
fallbacks remain distinct from the public customization inventory.

The complete 22-item installed application renders actual native/Svelte/Bits DOM
in default and custom layouts. Its aggregate stylesheet contains each expected
managed block exactly once with bytes equal to the authoritative source body.
The native state matrix includes unchecked/checked/indeterminate/disabled
controls, valid and invalid messages, loading Button, both Tabs orientations,
Avatar loaded/fallback/hidden states, and force-mounted native overlay content.

The browser sweep records a real before/override/restored computed CSS effect
for each of all 278 properties in each layout. It does not infer effect from
variable text or fabricated probe elements. Chromium CDP forces only CSS hover
and focus-visible pseudo matching; component state attributes remain owned by
the actual primitives. Real Menu focus and Escape witness highlighted and
closed-side selectors. Border sides are read separately when unequal native
Spinner colors leave its computed shorthand empty. Native transitions are
finished for stable computed observations; infinite Spinner animation remains
native. Every override and prior inline priority is restored.

All 34 radius contracts are measured on installed elements: shape defaults,
semantic/component fallback priorities, multi-corner elliptical overrides and
restoration. Broad semantic radius overrides retain Avatar, Radio, Spinner and
Switch-thumb circles while their exact properties customize them; Switch thumb
dimensions remain 14px by 14px. Full selector target coverage preserves the
native Progress pseudo-element owners. Transient starting-style selectors are
audited against their real owner; lifecycle timing belongs to the existing
presence/hydration lanes. This Chromium audit does not claim Gecko rendering.

## Verification

All final owning commands used the configured build router and exited 0:

- `node tools/run-unit-tests.mjs --suite registry tests/registry/css-contract-coverage.test.ts`: 3/3, no skips.
- `pnpm exec playwright test --config playwright.config.ts tests/browser/css-contracts.spec.ts`: 8/8, both layouts, zero lifecycle collector issues. Actual artifacts contain 278 successful property observations and 34 radius observations per layout.
- `pnpm run fixture:check`: zero errors/warnings; `pnpm run fixture:build`: passed.
- `pnpm run format:check`, `pnpm run lint`, `pnpm run typecheck`, `node tools/check-contracts.mjs`: passed.
- Diff whitespace and staged review: passed before commit.

Raw logs use `s186-`; successful per-property, selector, radius and installed
artifact evidence is in `implementation/evidence/logs/s186-browser-final-artifacts/`.
Earlier failed probes retain fixture/measurement diagnostics: required native
props, unsupported Menu option, absent unchecked/valid-message branches,
computed border shorthand and representative radius-owner selection. These
were qualification repairs; no product CSS or reference source was changed.
Rust checks are N/A. Existing reset, CSP, strict-declaration and final
platform/package/AC20 limits remain explicit. No original criterion changed.

Next original checkpoint is S187, catalog-wide themes and portal changes.
S186 awaits the mandatory separate S193 acceptance gate.
