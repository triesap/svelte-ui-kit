# S148 step report — Qualify Field associations and form lifecycle

Author: Codex. Locally verified candidate; independent S148 acceptance pending.
Implementation commit will be recorded after the green commit.

Original R20, R21, R22, R28, R29, R32, R33, R34. Starting
`a05e20bf9b3251b8c47bd4d77c28296f4966bd37` on `master`.

Real default/custom CLI consumers explicitly coinstall Field/Checkbox/Switch/
Radio. Helper verifies exact additional source bytes, requested identities and
complete production/source/lock/style hashes. Actual native and kit refs, labels,
current control IDs, described-by targets, bindings/events and convenience parts
are qualified together. Checkbox/Switch labels activate their real native button;
Radio label activates its first item and the group names itself through that
label. Native required validation focuses visible controls via existing kit
hidden-field behavior. Each named kit field submits exactly once. Disabled
native/kit controls are omitted from actual FormData; no second form engine.

Native resets restore input/textarea defaultValue and selected-option defaults
while updating actual bindings. Direct raw native controls independently reproduce
the same results. Cancelled reset retains all edits and kit state. Current native
form ownership controls Address/Checkbox/Switch reset/submission. Required marker
refs clear when no longer required; explicit false overrides remain native.
Helper/error removal updates actual paragraph targets, descriptions and descriptor
refs, including empty target sets. Entire field teardown clears every native/
kit/convenience ref; remount restores current IDs, state and valid associations.

Twelve concurrent same-worker requests per layout alternate initial helper/error
sets and values. All four initial message states hydrate with zero submit/reset
events, correct control/message/label sets and unique native-generated IDs for
multiple fields. Separate actual production SSR integration renders eight states
per layout, validates every initial for/described-by/labelled-by target and checks
initial native/kit form fields and executed handler identity.

The causal negative modifies only an owned copied Root: capture initial described
IDs instead of reading the current derived set. Initial error-present targets are
correct. Removing that error leaves exactly address-message-error dangling, and
the same target detector catches it. Actual mutated source/production identities
and explicit mutation disposition are retained. Product sources remain unchanged.

Initial browser lane 16/18: both current-owner cases reset the required convenience
text field without a reset default, correctly leaving it empty and blocking later
submission. A targeted native validity probe confirmed only that empty required
field was invalid. Add intended native defaultValue to the example, retain the
final empty-invalid-control assertion and rerun. Initial SSR integration 0/2
passed a relative route to the bounded renderer requiring an absolute path;
correct the harness route prefix. No product repair, diagnostic suppression,
ignored failure or omitted original requirement.

Verification through `cargo extbuild run --` after green doctor, Node24.21.0:

- `pnpm exec playwright test --config playwright.config.ts tests/browser/field.spec.ts tests/browser/field-description-control.spec.ts tests/browser/field-styles.spec.ts`: final 23/23, exit0; 18 mixed-form, four style and one causal-negative cases. Final negative-only rerun one/one after evidence-label clarification.
- `node tools/run-unit-tests.mjs --suite integration tests/integration/field-ssr.test.ts`: final two/two, exit0; sixteen actual SSR states across default/custom layouts.
- `node tools/run-unit-tests.mjs --suite components tests/components/field-types.test.ts tests/components/field-parts.test.ts tests/components/field-css.test.ts`: 24/24, exit0; strict native types, actual candidate compile/SSR and all 94 source declarations.
- `pnpm run fixture:check`, `pnpm run fixture:build`: exit0; exact metadata projection, zero errors/warnings and actual adapter output.
- `pnpm run lint`, `pnpm run typecheck`, `pnpm run format:check`, `pnpm run check:contracts`: final exit0.
- Diff/staged review and checks pass; original 203 checkpoint definitions unchanged. Conditional Cargo N/A.

Files: actual mixed-consumer helper/route, owning form/SSR browser/integration
checks and causal control, measured worksheet, this report and S147 bookkeeping.
Raw logs: `implementation/evidence/logs/s148-*.log`, `logs/generated-consumer/`,
`logs/field-ssr/` and per-case exact source/handler/response artifacts.
No remaining failure or blocker. Repository boundaries and accepted criteria
remain intact. Freeze the actual green candidate for separate original S129–S148
acceptance. Do not start S149 until that gate accepts; full MVP remains open.
