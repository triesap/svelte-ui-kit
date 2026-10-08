# S129 step report — Checkbox source and semantic API

Author: Codex. Independently accepted on code `aec5711b9d3368b1cc1f0416bca7f2f0ce5aa0a5` at evidence `bd2613c050c37cd883d4e2155a6eb264ce66c484`.
Original implementation commit: `e598d794df9085978fbe67ff281be6f10f0707f3`. The candidate narrative below
is historical implementation and verification provenance.
Implementation commit: `e598d794df9085978fbe67ff281be6f10f0707f3`.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S129","kind":"report","commit":"bd2613c050c37cd883d4e2155a6eb264ce66c484","disposition":"implemented"}
-->

Original requirements R03, R07, R20, R22, R25, R26, R32, R33, R34. Starting
`a30a97f4690ceeb3b41f5a7d84f2626c2907c05f` on `master`, after independent S128
acceptance anchored at `f9dc56f1921024c426b8df59c0c08abb28e2af7c`.

The immutable source component/manifest/CSS and actual pinned Checkbox public
Root type, component, state and hidden field were inspected. Exactly Checkbox
and CheckboxProps are frozen; the Root owns the fixed decorative source SVG,
so rendering snippets are excluded explicitly. Boolean checked and independent
indeterminate, both callbacks, actual ref, native events/attributes/style,
label/form/readonly/required/disabled and primitive type opt-ins retain the
pinned public types. No group, public indicator or extra variant is adopted.

The worksheet freezes source geometry/state/token/radius mapping and native
form participation. Pinned HiddenInput lacks reset and mixed-property bridging;
the narrow one-input approach already qualified for Switch is specified for
S130/S131. A direct Chromium native input control proves uncanceled form reset
restores defaultChecked while preserving current indeterminate, both false and
true. The planned bridge restores only checked; it must preserve cancellation,
current form ownership, dynamic reassociation and lifecycle cleanup. S129's type
fixtures qualify the public contracts; actual installed behavioral proof remains
in original S130/S131 and is not inferred from these compile checks.

Commands through `cargo extbuild run --` after green doctor, Node24.21.0:

- `node tools/run-unit-tests.mjs --suite components tests/components/checkbox-types.test.ts`:14/14, exit0; two valid exact-native/state cases and twelve causal fixture-only rejections, strict library checking.
- `pnpm run fixture:check`:exit0, maintained consumer zero errors/warnings.
- `pnpm run typecheck`, `pnpm run lint`, `pnpm run format:check`, `pnpm run check:contracts`:exit0; contracts zero errors/warnings.
- Direct Playwright Chromium native reset probe:exit0; checked resets true from defaultChecked, current mixed false/true remains false/true.
- `git diff --check` and staged diff check/review:exit0. Conditional Cargo N/A.

Exact files: `specs/component-maps/checkbox.md`, `registry/ui/checkbox.types.ts`,
`tests/components/checkbox-types.test.ts` and this report. No registry advertisement
or wrapper implementation precedes S130. Original203 definitions, accepted prior
work, reference source, parent index and remote state are preserved. No blocker
or scope deviation. Raw check logs: `implementation/evidence/logs/s129-*.log`.
Continue original S130 after this green candidate; separate S148 acceptance gates
S149 and full MVP/platform/package/AC20 criteria remain open.
