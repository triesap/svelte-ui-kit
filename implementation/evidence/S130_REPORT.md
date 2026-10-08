# S130 step report — Checkbox generated source and managed styles

Author: Codex. Locally verified candidate; independent S148 acceptance pending.
Implementation commit will be recorded after the green commit.

Original requirements R02, R03, R04, R06, R07, R08, R22, R25, R26, R32, R33,
R34. Starting `e598d794df9085978fbe67ff281be6f10f0707f3` on `master`.

The actual Bits Checkbox Root owns keyboard/pointer/readonly/disabled/state
semantics; checked, indeterminate and ref explicitly bind. The wrapper preserves
native attributes/events/callbacks/classes and owns the immutable fixed SVG
checkmark, with a fixed mixed mark for the supported primitive state. One named
native checkbox replaces only the primitive field. Required/disabled/name/value/
form, native defaultChecked, checked and actual indeterminate remain native.
A tree-local current-owner reset capture respects cancellation and restores
checked only; field destruction removes it and pending timers. Input focus returns
to the real visible primitive ref, preserving pinned validation focus behavior.
No keyboard or selection engine, runtime helper or extra public part is added.

All29 compiler-parsed immutable source CSS declarations are recorded with the
actual source SHA256 and compared against mapped selectors. Grid/indicator
geometry, stroke, tokens, radius, focus/disabled/cursor/checked design remain;
native state selectors replace input :checked, button box sizing/padding keep
source dimensions, mixed shares selection styling and the form field is offscreen.
The original checkbox radius metadata/fallback and every token default are unchanged.

The complete two-source/two-export/one-style cohort is advertised with tokens
and Bits2.19.3 dependencies. Actual default/custom CLI applications qualify exact
installed bytes/bases, unchanged dry run, lock origins, managed block order,
strict doctor, actual check/build/SSR, one named input, unnamed field omission,
checked/unchecked/mixed native state and fixed SVG paths. Repeated add/sync
preserves the complete application tree. Actual raw consumer check/build logs,
SSR responses, source hashes and executed handler identities are retained.

Commands through `cargo extbuild run --` after green doctor, Node24.21.0:

- `node tools/run-unit-tests.mjs --suite integration tests/integration/checkbox-install.test.ts`: final3/3, exit0. Initial3/3 also passed; final adds actual mixed SSR, strict doctor and retained evidence.
- `node tools/run-unit-tests.mjs --suite components tests/components/checkbox-types.test.ts tests/components/checkbox-css.test.ts`:15/15, exit0; immutable full29-declaration comparison and exact positive/negative types.
- `pnpm run test:registry`:49/49, exit0, including the existing sole checkbox radius hook and fallback.
- `pnpm run test:package`:3/3, exit0, actual offline tarball inventory/runtime.
- `pnpm run fixture:check`, `pnpm run fixture:build`:exit0; consumer zero errors/warnings and real Node-adapter output.
- `pnpm run typecheck`, `pnpm run lint`, `pnpm run format:check`, `pnpm run check:contracts`:exit0; zero contract errors/warnings.
- `git diff --check`, staged diff check/review:exit0. Conditional Cargo N/A.

Files: Checkbox wrapper/manifest/CSS, root registry/hash, source CSS inventory,
CSS/component and actual install tests, existing token-contract test/worksheet,
this report and preceding S129 checkpoint/projection/report bookkeeping. Initial
asset-generation utility rejected a direct CommonJS named import before asset
writes; resolving the public compiler via createRequire corrected the utility.
No test failure or product repair was hidden. Logs: `implementation/evidence/logs/s130-*.log`
and `logs/checkbox-install/`. Behavioral form/reset/geometry/lifecycle proof remains
original S131; no independent acceptance is inferred from installation checks.
No blocker or scope deviation; parent/reference/remotes preserved. Continue S131
after this green candidate; original separate S148 gate still controls S149.
