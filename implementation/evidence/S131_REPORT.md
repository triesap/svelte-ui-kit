# S131 step report — Checkbox installed behavior and lifecycle

Author: Codex. Locally verified candidate; independent S148 acceptance pending.
Implementation commit will be recorded after the green commit.

Original requirements R03, R07, R20, R22, R23, R25, R26, R29, R32, R33, R34.
Starting `f1716d9b26ed0c5940831e23e21296e4f8edf049` on `master`. Real built-CLI
installations in default/custom layouts retain exact installed source, CSS/lock
and production hashes before actual check/build/SSR/Chromium execution.

Pointer/Space/Enter, programmatic binding, callbacks, refs, caller classes/attrs,
visible label activation, disabled refusal, cancellation, readonly and initial
checked state match native behavior. Twelve concurrent actual production responses
per layout alternate checked/mixed independently, retain raw responses and
hydrate initial checked+mixed with no unexpected errors. Two simultaneous controls
and named versus unnamed fields remain distinct. Every named control contributes
one real input; successful checked submission, unchecked omission, required
validation/focus, disabled omission, initial and canceled reset, external owner
replacement and reactive form reassociation are exercised.

Mixed is an independent boolean. The real field receives its actual indeterminate
property; mixed false-checked contributes no value, activation clears mixed and
checks exactly once with native callbacks. A direct native input reset control
proves defaultChecked restoration preserves current mixed. The wrapper keeps
those semantics for uncanceled and canceled resets. A direct pinned readonly
Root confirms Space can still synthesize caller click events while checked
remains unchanged. Native Root consumes form for its field, not its button;
actual one-field reassociation still follows the application prop. The worksheet
records these measured native contracts without a wrapper workaround.

Computed styles prove 16px outer/button/SVG, exact viewBox/path, semantic surface/
selection/stroke, source radius fallback and exact override, focus outline,
disabled opacity, direction and reduced-motion stability. No new transition or
variant is introduced. Reset destruction/remount preserves external bound state
and one field. Actual EventTarget capture instrumentation proves four live reset
listeners, three after destruction and four after remount. An owned installed
application removes both actual pending-timer and listener cleanup: the destroyed
state changes incorrectly, its stale listener remains and remount increases
listeners to five. Thus both teardown detectors have causal negatives, with
mutated source/production identity retained. Product/package/reference source
is unchanged by these controls.

Commands through `cargo extbuild run --` after green doctor, Node24.21.0:

- `pnpm exec playwright test --config playwright.config.ts tests/browser/checkbox.spec.ts`: final30/30 Chromium, exit0; twenty-eight real installed cases and two actual missing-cleanup controls across default/custom layouts.
- `node tools/run-unit-tests.mjs --suite components tests/components/checkbox-types.test.ts`:14/14, exit0.
- `pnpm run fixture:check`, `pnpm run fixture:build`:exit0, zero errors/warnings and real Node-adapter output.
- `pnpm run typecheck`, `pnpm run lint`, `pnpm run format:check`, `pnpm run check:contracts`:exit0; contracts zero errors/warnings.
- `git diff --check`, staged check/review:exit0. Conditional Cargo N/A.

Initial22/26 failed two harness assumptions per layout: CSS normalizes .55 to0.55,
and readonly Space synthesizes a third caller click. Subsequent28/30 failed an
incorrect button form-attribute assertion. Direct native controls, actual source
and measured attributes correct those assertions; state/form obligations remain
intact. Final30/30 additionally instruments real listener cleanup. No product
repair, criterion relaxation, skip or ignored browser diagnostic was introduced.
All raw outcomes are retained in `implementation/evidence/logs/s131-*.log`.
Final per-case artifacts retain installed/production hashes, concurrent SSR
responses, the native mixed-reset control and the owned cleanup mutation.

Files: installed-consumer helper, `tests/browser/checkbox.spec.ts`, actual
qualification route, measured worksheet, this report and preceding S130
checkpoint/projection/report bookkeeping. Original203 definitions and previously
accepted work remain intact. Parent index, reference source and remotes preserved;
no blocker or scope deviation. Checkbox S129–S131 is implemented/locally verified,
not independently accepted. Continue original S132 Radio contract; separate S148
acceptance gates S149 and later catalog/platform/package/AC20 criteria remain.
