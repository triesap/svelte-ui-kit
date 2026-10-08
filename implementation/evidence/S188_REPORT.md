# S188 implementation report — accessibility, direction and motion

Author: Codex. Implemented candidate; separate S193 acceptance remains required.
Implementation commit: `bee870dab29e3becd736ed0283816b533de33296`.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S188","kind":"report","commit":"bee870dab29e3becd736ed0283816b533de33296","disposition":"candidate"}
-->

## Implementation and observed behavior

An actual complete 22-item catalog application is installed, checked and built
in default/custom layouts. Twenty focused cases cover both layouts and LTR/RTL.
Chromium's native accessibility-tree tooling records real roles, control names,
required state and modal descriptions; direct browser assertions cover labels,
invalid state, disabled/busy loading feedback and decorative/status Spinner.
The loading Button exposes its actual Loading label rather than its hidden
pending content. No duplicate loading status is fabricated.

Native keyboard cases skip disabled Radio/Tabs/Menu entries and verify actual
selection/focus, Checkbox/Switch state, logical Switch-thumb travel and visible
focus. Named Dialog wraps focus through its live input/Close, exposes its real
description and restores its trigger. Alert Dialog preserves the distinct role,
native focus and Escape return. Reduced-motion media removes Spinner animation
and native CSS transitions without hiding feedback or essential expanded state.

Twenty-three visible text observations per layout/direction preserve the source
palette and use actual foreground/opaque backdrop colors. Entered native text
and the visible Select value are measured; hidden/transparent text is excluded.
All observed ordinary-text ratios exceed 4.5 without threshold rounding; the
lowest invalid-message ratio is 4.615804459238792. Original non-text Radio
boundary and unchecked Switch ratios are 1.4735129263833868 and
2.5388412065932826. The companion ACCESSIBILITY.md records these source
concerns, primary W3C guidance and bounds under AC18. They are not a blanket
certificate, a claimed passing 3:1 result or a redesigned palette. Independent
review must assess the original-source disposition; any required unresolved
issue blocks release.

## Verification

Final owning commands use the configured build router:

- `pnpm exec playwright test --config playwright.config.ts tests/browser/accessibility-states.spec.ts`: 20/20, both layouts/directions, zero strict lifecycle issues.
- `pnpm run fixture:check`: zero errors/warnings; `pnpm run fixture:build`: passed.
- `pnpm run format:check`, `pnpm run lint`, `pnpm run typecheck`: passed on the final focused implementation and accessibility evidence.
- `node tools/check-contracts.mjs`: passed; all 203 original checkpoint definitions compare byte-identical with the adopted baseline.
- Required `pnpm run test:browser`: 685/685 passed, zero failures/skips, in 20.6 minutes. This includes the maintained production build and every existing/new browser file, with all final owning servers/lifecycle checks released successfully.
- Final diff whitespace/staged review: passed before commit.

Focused artifacts are in
`implementation/evidence/logs/s188-browser-focused2-artifacts/`; raw owning logs
use `s188-`; the full lane log is `implementation/evidence/logs/s188-browser-full.log` and its ordinary artifacts are in `tests/browser/.output/`. Initial failed probes retain the required HTML attribute versus
redundant ARIA expectation, actual loading accessible name and unchecked Radio
contrast-selection corrections. These are qualification corrections, with no
product behavior, dependency or reference-source changes. The suite adds no
SSR-disable, accessibility suppression or broad screen-reader/WCAG claim.
Rust checks are N/A. Earlier reset/force-mount/CSP/strict-declaration and final
platform/package/AC20 limits remain explicit.

The next original checkpoint is S189, full-catalog SSR/hydration. S188 remains a candidate awaiting
the mandatory separate S193 acceptance gate.
