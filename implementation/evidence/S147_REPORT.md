# S147 step report — Style and register Field

Author: Codex. Locally verified candidate; independent S148 acceptance pending.
Implementation commit will be recorded after the green commit.

Original R02, R04, R06, R10, R32, R33, R34. Starting
`991b51ed04d759969b440fd04c7dcc44a8c398cd` on `master`.

Register the complete fifteen-source Field cohort: twelve native components,
context/types/index and one managed style block. Twenty-six flat exports cover
all twelve component/Props pairs plus native FieldSlot and TextInputType types.
Only tokens is a registry dependency; no npm dependency, partial source family,
validation engine or deferred select/combobox API.

Immutable inventory compares all 94 parsed source CSS declarations with actual
source identity and mapped selectors/values. Preserve all 40 hooks and all five
original radius chains. Append 35 records after the unchanged original 228:
263 unique records. Tokens0.1.9 records metadata only; semantic contract/defaults
and token CSS are unchanged. Consumer metadata is an exact generated projection.
Multiline var calls and repeated hooks with distinct local fallbacks are preserved;
original metadata retains its canonical source control chains.

Real built CLI default/custom installation proves exact source bytes/bases,
dependency closure, public exports/types, coinstalled Dialog, zero-effect dry
runs, check/build/SSR, strict doctor and replay. Local source comments and CSS
radius customization survive sync with exact adoption bases and other metadata;
only effective stylesheet-v1 aggregate bookkeeping changes. The next sync leaves
the complete satisfied tree unchanged. A package missing FieldMessage refuses
add before consumer effects. Actual source/style/lock/types/handler artifacts
are retained, including initial server descriptions targeting real paragraphs.

Installed Chromium measures field/surface grids, source spacing/padding/minimum
size, radius precedence, textarea resize, actual native select padding and the
source invisible overlay covering its entire surface. Clicking that surface
focuses the real native select; decorative value row/icon preserve pointer policy.
Native focus/invalid/disabled paint, exact elliptical radius/background/padding
customization, RTL logical icon/select geometry and reduced motion are measured.

Initial style lane 0/4: two harness comparisons expected raw hex instead of
computed RGB; compare through an independent native DOM color control. The two
reduced-motion cases exposed retained source transition timing. Add a bounded
target CSS override disabling control border/shadow transitions under reduced
motion, while retaining every original declaration and source default timing.
Fresh install/style/registry/package/CSS lanes pass. No diagnostic suppression or
requirement omission; the repair remains subject to independent S148 acceptance.

Verification through `cargo extbuild run --` after green doctor, Node24.21.0:

- `pnpm run build`: final exit0; actual CLI.
- `node tools/run-unit-tests.mjs --suite integration tests/integration/field-install.test.ts tests/integration/tokens-install.test.ts`: fresh final 7/7, exit0.
- `pnpm exec playwright test --config playwright.config.ts tests/browser/field-styles.spec.ts`: fresh four/four, exit0; actual default/custom CLI consumers.
- `node tools/run-unit-tests.mjs --suite components tests/components/field-css.test.ts tests/components/field-types.test.ts tests/components/field-parts.test.ts`: 24/24, exit0; final CSS-only rerun one/one after reduced-motion repair.
- `pnpm run test:registry`: fresh final 53/53, exit0; all 40 hooks match CSS and worksheet.
- `pnpm run test:package`: fresh final three/three, exit0; actual offline inventory/runtime.
- `pnpm run fixture:check`, `pnpm run fixture:build`: exit0; exact token projection, zero errors/warnings and real adapter.
- `pnpm run lint`, `pnpm run typecheck`, `pnpm run format:check`, `pnpm run check:contracts`: final exit0.
- Original 228 metadata records, semantic contract, token CSS and 203 checkpoint definitions unchanged. Diff/staged review and checks pass. Conditional Cargo N/A.

Files: complete Field index/manifest/CSS/root hash, immutable source inventory,
metadata/token version/exact fixture projection, worksheet, owning CSS/install/
style-browser/registry checks, installed-consumer helper/route, this report and
S146 bookkeeping. Raw logs: `implementation/evidence/logs/s147-*.log`,
`logs/field-install/`, `logs/generated-consumer/` and per-case artifacts.
No remaining failure, blocker or scope deviation. Repository boundaries and
accepted criteria remain intact. Continue original S148 after the green commit;
separate S148 and full MVP acceptance remain open.
