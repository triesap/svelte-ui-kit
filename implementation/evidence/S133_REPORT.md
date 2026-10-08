# S133 step report — Radio candidate parts and native reset correction

Author: Codex. Locally verified candidate; independent S148 acceptance pending.
Implementation commit will be recorded after the green commit.

Original requirements R03, R20, R21, R28, R32, R33, R34. Starting
`1182f90024ff5bdd45e1681ec5fa185fd3669f49` on `master`.

RadioGroup and RadioItem use the actual pinned primitive, explicit value/ref
bindings, native caller classes/attrs/events, string selection and exact default/
delegated snippets. Default and delegated DOM attach real DIV/BUTTON/SECTION refs;
checked snippet payloads, group/item labels, disabled refusal, callback ordering,
programmatic value updates and native cancellation are exercised against real
compiled candidate code. No wrapper keyboard, roving-focus or selection store is
added. This incomplete source/style cohort remains unadvertised through S133.

A direct candidate/raw native comparison reproduced the required form-reset gap.
After selecting b and resetting, both Group values stayed b while both fields
cleared to empty. Initial native browser lane passed2/3 and failed this precise
state-coherence criterion. Before artifacts, source/production identities and
observed values are retained in `logs/radio-candidate/native-before-*`.

The correction withholds only name from the primitive and emits exactly one
native text field, matching its existing successful-value/required/disabled
policy. Native defaultValue captures initial string value per instance. A
current-owner tree-local capture settles after cancellation, restores initial
bound selection only on an uncanceled reset, and clears listeners/pending timers
on field destruction. Field focus uses the actual native current tabstop; no
navigation algorithm is copied. The raw native control still proves its original
empty-field/stale-selection limitation; corrected candidate reset follows an
explicit native default-value comparator. Canceled reset preserves both values
and resetting adds no selection callback. Further installed lifecycle/validation
qualification remains original S135, with mandatory separate S148 acceptance.

Commands through `cargo extbuild run --` after green doctor, Node24.21.0:

- `pnpm exec playwright test --config playwright.config.ts tests/browser/radio-candidate.spec.ts`: final5/5 Chromium, exit0. Actual value/callback/ref/attrs/default+delegated snippets, disabled/cancellation, native reset comparison, canceled/default-value reset and twelve concurrent shared-handler SSR responses. Earlier repaired3/3 also passed before adding complete cancellation/request controls.
- `node tools/run-unit-tests.mjs --suite components tests/components/radio-types.test.ts tests/components/radio-parts.test.ts`:15/15, exit0. Actual candidate Svelte check/build and initial a/b SSR retain native radio markup, snippet state and executed handler hashes; catalog remains unadvertised.
- `pnpm run fixture:check`, `pnpm run fixture:build`:exit0, maintained consumer zero errors/warnings and real Node-adapter output.
- `pnpm run typecheck`, `pnpm run lint`, `pnpm run format:check`, `pnpm run check:contracts`:exit0; contracts zero errors/warnings.
- `git diff --check`, staged check/review:exit0. Conditional Cargo N/A.

Files: `registry/ui/radio/group.svelte`, `item.svelte`, real candidate route/helper,
component/browser tests, measured Radio worksheet, this report and preceding
S132 checkpoint/projection/report bookkeeping. Raw logs: `implementation/evidence/logs/s133-*.log`,
`logs/radio-candidate/` and actual per-case source/production/native-control/SSR
attachments. Required form reset was corrected rather than waived; no public
API, dependency or criterion broadened. Original203 definitions, prior acceptance,
parent/reference/remotes preserved. No blocker. Continue original S134 source/CSS
registration; this repaired candidate is not independently accepted. Separate
S148 acceptance still gates S149 and later catalog/platform/package/AC20 work.
