# S126 step report — Menu registration and managed styles

Author: Codex. Candidate; independent S128/RCLD-07 acceptance pending.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S126","kind":"report","commit":"d67cc15ec8b67684b97164b531d30a6e15c19b3b","disposition":"candidate"}
-->

Requirements R04, R06, R08, R14, R26, R32, R33, R34. Starting `c02e65e` on
`master`. Complete eight-part Menu now advertises ten source files, sixteen flat
value/type exports and one managed CSS block in a single Menu compatibility
cohort. Only tokens and pinned Bits2.19.3 are dependencies; native identity needs
no kit helper. Installed default/custom trees use exact authored bytes and
root exports, not template-only imports.

The immutable source CSS capture records67 parsed declarations and exact source
SHA256 at the approved revision. Compiler-parsed comparison preserves all design
declarations except three virtual Root wrapper declarations and inner fixed
position: native Root has no DOM and native outer floating wrapper owns geometry.
Item :disabled maps to actual data-disabled; all design tokens/local transitions
remain on inner Content. Reduced motion disables inner transition. Source
translation custom properties are local motion, not replacement positioning.

All158 prior customization entries, including original30radii and later four
Alert Dialog radii, remain byte-identical;32source Menu hooks are appended,
190total,35Menu hooks including its three existing radii. Semantic44defaults
remain unchanged. Tokens version0.1.6 truthfully advances metadata; exact
maintained projection and bundled content digest regenerated after formatting.

Commands ran from repository root via `cargo extbuild run --` after green doctor,
Node24.21.0/pnpm11.22.0/Svelte5.57.1/Bits2.19.3:

- `pnpm run build`: exit0.
- `node tools/run-unit-tests.mjs --suite integration tests/integration/menu-install.test.ts`: final4/4, exit0. Exact manifests/assets/cohort inventories; default/custom real built CLI init/add dry-run/apply/check/build/SSR/replay/sync/strictdoctor, Dialog coexistence and actual incomplete-package asset refusal before effects.
- `node tools/run-unit-tests.mjs --suite components tests/components/menu-css.test.ts tests/components/menu-types.test.ts tests/components/menu-state.test.ts tests/components/menu-content.test.ts tests/components/menu-items.test.ts`:30/30, exit0. Source67CSS mapping, all-eight compiled parts/SSR and26strict native positive/negative/equality/owned-unadvertised controls.
- `node tools/run-unit-tests.mjs --suite registry`: final48/48, exit0; all35Menu hook fallback declarations/documentation included.
- `pnpm exec playwright test --config playwright.config.ts tests/browser/menu-styles.spec.ts`:4/4 Chromium, exit0. Actual installed default/custom inner design and outer geometry, indicator width/highlight state, component/role/default radius overrides, live color and reduced motion.
- `node tools/run-unit-tests.mjs --suite package`:3/3, exit0; actual offline packed contents and standalone binary, no publication.
- `pnpm run typecheck`, `pnpm run lint`, `pnpm run format:check`, `pnpm run fixture:check`, `pnpm run fixture:build`, `pnpm run check:contracts`:exit0; lint/format/contracts rerun after final fixture/docs. Maintained Svelte zero errors/warnings and real Node-adapter build.
- `git diff --check` and staged check:exit0.

Raw logs: `implementation/evidence/logs/s126-*.log`; installed check/build and
actual SSR/source/config/lock/CSS/handler records under `logs/menu-install/`;
full production hash inventories and browser application checks under
`logs/generated-consumer/`. The first install2/4 expected the wrong combined
root sort order; the final test expects actual canonical dialog/menu ordering.
The first registry47/48 exposed missing existing-radius worksheet rows, now
explicitly documented. Original refusal controls persist in owned unadvertised
registry copies; live candidate assertions now reflect complete registration.
No test enforcement, original requirement or accepted checkpoint weakened.

Self-review: only scheduled registration/style/source-map/test/helper and
predecessor bookkeeping changes. No tests skipped. Cargo N/A for TS-only target;
qualified upstream declaration/reference exceptions remain AC20 debt. Installed
keyboard/selection/nesting and placement/themes/CSP/SSR/cleanup acceptance still
require S127/S128 and separate review. No parent/reference/remote mutation.

Commit subject: `menu: register the floating family and managed styles`; actual
SHA follows green commit. S127 safe after this commit in exact RCLD-07 batch;
S129 stays gated by independent S128 acceptance.
