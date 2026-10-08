# S187 implementation report — full catalog theme scopes

Later paired raw Bits/generated closed-forceMount runtime evidence is recorded
in [RCLD-10_FORCE_MOUNT_QUALIFICATION.md](RCLD-10_FORCE_MOUNT_QUALIFICATION.md).
It verifies default body locking, caller preventScroll/delegated-child controls,
actual outside pointer activation and teardown. The source-inspection inference
below remains historical; independent acceptance of the new evidence and the
full S193 gate remain separate.

Author: Codex. Independently accepted on code `abeccabbdfda5aedb7be4f72e3b51a4675d3a609` at evidence `8ab760dc4d674853b172126b2a3ec3a0434c678f`.
Original implementation commit: `57172cf304f3649562061eb9630a8fa6971c62b5`. The candidate narrative below
is historical implementation and verification provenance.
Implementation commit: `57172cf304f3649562061eb9630a8fa6971c62b5`.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S187","kind":"report","commit":"8ab760dc4d674853b172126b2a3ec3a0434c678f","disposition":"implemented"}
-->

## Implementation and observed behavior

The generated-consumer helper installs all 22 real items in default/custom
layouts. Two actual complete catalog compositions inherit document and nested
application themes. Twenty styled component families have direct rendered
color/background/accent/border checks; RouterLink shares the second native
Anchor. Every present kit-class element is also checked against its actual
scope's inherited text token. Native closed overlay parts use normal presence;
separate interaction cases qualify their actual open content.

Global changes update the document catalog while the nested scope retains its
own values. Nested changes update its catalog without changing document values.
The application stores its document choice and restores it after reload;
nested state intentionally resets to its initial application value. No kit
store, persistence API or copied inline token state was introduced.

For each Dialog, Alert Dialog and Menu, open body portals inherit the document
theme despite nested triggers; explicit custom hosts inherit the nested theme.
Changes occur through actual native controls while content remains open. The
native parent/host relationship, colors, unchanged empty inline kit-token
inventory, Escape dismissal and live trigger focus return are asserted. Native
Menu floating geometry remains on its actual outer wrapper. Existing documented
transformed/clipping-host limits remain in force.

Before checking/building each application, real CLI sync runs after installing
application themes and custom app CSS. Theme CSS, app CSS, existing layout and
the application catalog component are compared byte-for-byte before/after;
four exact digests per layout join the resulting artifact evidence. README
explains the aggregate, stylesheet order and application-owned persistence.

## Verification and bounds

All final owning commands used the configured build router and exited 0:

- `pnpm exec playwright test --config playwright.config.ts tests/browser/catalog-themes.spec.ts`: 14/14 across both layouts, strict lifecycle collectors report zero issues.
- `node tools/run-unit-tests.mjs --suite integration tests/integration/layout-imports.test.ts`: 10/10, no skips.
- `pnpm run fixture:check`: zero errors/warnings; `pnpm run fixture:build`: passed.
- `pnpm run format:check`, `pnpm run lint`, `pnpm run typecheck`, `node tools/check-contracts.mjs`: passed.
- Diff whitespace and staged review: passed before commit.

Raw logs use `s187-`; final rendered catalogs, portal relationships and
installed/sync-preservation evidence are retained in
`implementation/evidence/logs/s187-browser-final-artifacts/`.
Earlier probes retain two qualification findings. CSS minification serializes
untyped inherited color variables as hex; direct rendered colors still use
expected RGB assertions, while raw token inheritance compares actual scope
values. Reusing the force-mounted closed S186 visual inventory intercepted
clicks: native overlays have inline pointer handling, and hiding them still
left body interactions blocked. The pinned native nondelegated Dialog/Alert
Content source mounts ScrollLock in that branch even when closed; its body lock
sets pointer-events none. This source inspection explains the observed boundary
but is not a separate raw-native runtime qualification. The S187 composition
uses normal presence, removes no native behavior from generated wrappers and
does not claim acceptance of all force-mount interaction policies. Independent
S193 review must assess this retained boundary with the original requirements.

Rust checks are N/A. Earlier native reset, CSP, strict-declaration and final
platform/package/AC20 limits remain explicit. No source, registry asset,
dependency, original criterion or reference repository changed.

Next original checkpoint is S188, accessibility/direction/motion states.
S187 awaits the mandatory separate S193 acceptance gate.
