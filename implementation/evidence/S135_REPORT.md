# S135 step report — Installed Radio keyboard and forms

Author: Codex. Independently accepted on code `aec5711b9d3368b1cc1f0416bca7f2f0ce5aa0a5` at evidence `bd2613c050c37cd883d4e2155a6eb264ce66c484`.
Original implementation commit: `e00898ce42c2f7d9bce6683416e815fe81c70c9b`. The candidate narrative below
is historical implementation and verification provenance.
Implementation commit: `e00898ce42c2f7d9bce6683416e815fe81c70c9b`.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S135","kind":"report","commit":"bd2613c050c37cd883d4e2155a6eb264ce66c484","disposition":"implemented"}
-->

Original R20, R22, R23, R29, R32, R33, R34. Starting
`2de68a337c18ff202500b682a3feffc7f630a77c` on `master`.

Actual default/custom built-CLI consumers exercise selected and empty native
values, arrows/Home/End, looping boundaries, horizontal/vertical and RTL,
disabled-choice skipping, readonly focus without selection, labels, caller
cancellation, refs, binding and callback ordering. Source indicator geometry,
focus paint, live radius/theme changes and named value fields remain synchronized.
Dynamic removal preserves the primitive's authoritative string; remounted items
participate in navigation without another selection/focus engine.

One actual native text field submits the selected value. Required empty values
prevent submission and focus the current native tabstop; disabled groups omit
their field and cease validation. Unnamed groups emit no field. Canceled reset
preserves binding/field; uncanceled current-owner reset restores the initial
value without selection callbacks. Actual same-ID form replacement proves the
listener resolves current input.form rather than stale form identity. Resetting
another form does not affect the main group. Twelve concurrent same-worker SSR
responses per installed layout retain independent a/b/c/empty selections and
independent second-group state; selected B hydrates with the same one named field.

Destroy during reset preserves the external B value, cancels the queued timer,
and removes the actual capture listener (2 → 1 → 2 across destroy/remount). An
owned installed copy with both cleanup statements removed changes destroyed
state to A and leaks a listener (2 → 2 → 3). The production and mutated sources,
complete handler hashes and actual consumer/SSR artifacts are retained. This
causal control does not grant independent acceptance of the S133 reset bridge.

Initial browser run: 18/22 passed, four harness failures in the two layouts.
Root exposes native data-orientation rather than aria-orientation; clearing a
value retains B as the native current tabstop rather than forcing A. Inspected
pinned behavior and observed DOM justify correcting those two assertions.
No wrapper change, suppression, skip or native keyboard-engine replacement.
Raw Bits empty-value control independently matches focus-only arrows until
Space/click selects. These limits are explicit in the Radio worksheet.

Verification through `cargo extbuild run --` after green doctor, Node24.21.0:

- Fresh combined `pnpm exec playwright test --config playwright.config.ts tests/browser/radio.spec.ts tests/browser/radio-styles.spec.ts tests/browser/radio-candidate.spec.ts`: 31/31 Chromium, exit0; 22 new installed cases plus preserved four style and five candidate cases.
- `node tools/run-unit-tests.mjs --suite components tests/components/radio-types.test.ts`: 14/14, exit0, exact pinned positive/negative types.
- `pnpm run fixture:check`, `pnpm run fixture:build`: exit0; maintained fixture zero errors/warnings and real Node-adapter output.
- `pnpm run typecheck`, `pnpm run lint`, `pnpm run format:check`, `pnpm run check:contracts`: exit0.
- `git diff --check`, staged diff review/check: exit0; conditional Cargo N/A.

Files: installed Radio browser suite, qualification route, measured worksheet,
this report and previous S134 report/checkpoint/projection bookkeeping. Logs:
`implementation/evidence/logs/s135-*.log`, generated-consumer check/build logs,
per-case actual installed/mutated inventory and concurrent SSR artifacts.
No remaining failure, blocker, ignored issue or scope deviation. Original 203
definitions, accepted criteria and source identities remain intact. Continue
original S136 Tabs freeze after this green commit; separate S148 acceptance
still gates S149 and the full MVP remains open.
