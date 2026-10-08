# S146 step report — Author Field semantic source parts

Author: Codex. Locally verified candidate; independent S148 acceptance pending.
Implementation commit will be recorded after the green commit.

Original R03, R20, R21, R22, R28, R32, R33, R34. Starting
`849ee003204c75d56b28f0123f419a67f62ab885` on `master`.

Implement all twelve frozen native parts and local getter-based field context.
Root owns required/disabled/invalid states, stable native-derived control IDs and
keyed message targets. It renders those messages after children and derives
described-by from the same current list, including during SSR. Encode message
keys into stable ID segments. Descriptor refs bind to explicit ref properties;
direct part refs use ordinary native bind:this/bind:ref and cleanup.

Surface/Label/Required/Message preserve source markup/classes and state attrs.
Required and icon remain aria-hidden. Native input/textarea/single-select retain
typed attrs/events, string bindings and actual element refs; explicit false
state/association overrides remain honored. Native controls may stand alone.
Source TextField/TextAreaField/SelectField recipes retain label/required/message,
native control, optional label action and visible select value/icon markup.
No validation library, global identity, store, second keyboard or reset engine.

Actual copied candidate compiles/builds all fourteen authored files. Four server
states (invalid false/true and two initial values) prove real labels, initial
active-message targets, unique IDs, native attrs, override behavior and source
convenience parts. Every for/described-by token resolves to a rendered element.
Candidate Chromium proves all native refs including paragraph descriptor refs,
label focus, input/select callbacks and binding, convenience defaults, retained
keyed helper DOM through dynamic error addition/removal, inherited disabled/
required states with explicit false overrides and live changed control ID/label.

First candidate compilation stopped at zero errors/one warning: Label's initial
guard captured the initial for prop. Root cause repaired by deriving the current
target and guard together in a reactive closure. Initial lint reported the same
warning; neither lane suppresses it. Fresh check/build, unit and browser lanes
pass, including the added changed-ID activation test. No ignored diagnostic.

Verification through `cargo extbuild run --` after green doctor, Node24.21.0:

- `node tools/run-unit-tests.mjs --suite components tests/components/field-parts.test.ts tests/components/field-types.test.ts`: final 23/23, exit0; actual check/build/SSR and 22 strict type cases.
- `pnpm exec playwright test --config playwright.config.ts tests/browser/field-candidate.spec.ts`: final three/three, exit0; actual compiled candidate with strict whole-lifecycle issue collection.
- `pnpm run fixture:check`, `pnpm run fixture:build`: exit0; zero errors/warnings and actual adapter output.
- `pnpm run lint`, `pnpm run typecheck`, `pnpm run format:check`, `pnpm run check:contracts`: final exit0.
- Diff/staged review and checks pass; original 203 checkpoint definitions unchanged. Conditional Cargo N/A.

Files: twelve native Field components and context, candidate route/build helper,
owning SSR/unit/browser tests, worksheet, this report and S145 bookkeeping.
Raw logs: `implementation/evidence/logs/s146-*.log`, `logs/field-candidate/`,
and per-case production identities/actual response artifacts.
No remaining failure, blocker or scope deviation. Repository boundaries and
accepted criteria remain intact. Continue original S147 after the green commit;
separate S148 and full MVP acceptance remain open.
