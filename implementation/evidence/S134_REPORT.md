# S134 step report — Radio source design and complete registration

Author: Codex. Locally verified candidate; independent S148 acceptance pending.
Implementation commit: `2de68a337c18ff202500b682a3feffc7f630a77c`.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S134","kind":"report","commit":"2de68a337c18ff202500b682a3feffc7f630a77c","disposition":"candidate"}
-->

Original requirements R04, R06, R07, R25, R26, R32, R33, R34. Starting
`4052bf07efc4bf0a0b0e197a43f583914b9af486` on `master`.

The complete RadioGroup/RadioItem family is registered as four source files,
four flat value/type exports and one managed style block in a single radio
cohort. Tokens and pinned Bits2.19.3 remain the only registry/runtime dependencies.
Index re-exports actual sibling parts/types; no Indicator or extra runtime API
is invented. The candidate component test now truthfully records advertised
catalog state while remaining distinct from actual CLI install proof.

All13 immutable source declarations are compiler-parsed with actual source
SHA256 and compared to mapped CSS. Native button data-state replaces :checked;
zero padding/border-box preserves original dimensions and native form field
CSS is offscreen. The source gradient retains circle shape, 0–28% selected mark,
30% transparent edge and original semantic selection/primary/surface/border
colors. Original radius fallback remains component then full radius, independent
of broad control/default radii. All token defaults and customization metadata
are unchanged; the existing sole radio hook is also qualified by registry tests.

Actual default/custom built-CLI installations qualify exact target inventory,
bytes/bases/dependency closure, zero-effect dry run, flat exports, coinstalled
Dialog name uniqueness, generated check/build/SSR, strict doctor and unchanged
complete-tree replay. An owned package missing required Item source refuses add
before any consumer effects. Actual handler/source/CSS/lock/type-fixture identities
and raw check/build/response artifacts are retained. Offline tarball inventory
and runtime checks also pass without source-layout fallback or package-store edits.

Real installed Chromium measures 16px button geometry, circle source gradient
with exact percentage stops/colors, names/refs/classes, checked/unchecked paint,
native disabled/focus styling, one 1px form field, full-radius precedence,
live exact radius/semantic overrides, RTL and reduced-motion stability. Source
paint artifacts retain actual computed gradient/color/rects. Original S135 still
owns the full installed keyboard/form/reset/lifecycle qualification.

Commands through `cargo extbuild run --` after green doctor, Node24.21.0:

- `node tools/run-unit-tests.mjs --suite integration tests/integration/radio-install.test.ts`:4/4, exit0.
- `pnpm exec playwright test --config playwright.config.ts tests/browser/radio-styles.spec.ts`:4/4 Chromium, exit0, actual installed default/custom apps.
- `node tools/run-unit-tests.mjs --suite components tests/components/radio-types.test.ts tests/components/radio-parts.test.ts tests/components/radio-css.test.ts`:16/16, exit0; exact types, actual candidate SSR and full13-declaration source comparison.
- `pnpm run test:registry`:50/50, exit0; existing radio radius hook/fallback matches actual CSS/worksheet.
- `pnpm run test:package`:3/3, exit0, actual offline tarball inventory/runtime.
- `pnpm run fixture:check`, `pnpm run fixture:build`:exit0, maintained consumer zero errors/warnings and real Node-adapter output.
- `pnpm run typecheck`, `pnpm run lint`, `pnpm run format:check`, `pnpm run check:contracts`:exit0; contracts zero errors/warnings.
- `git diff --check`, staged check/review:exit0. Conditional Cargo N/A.

Files: Radio index/manifest/CSS, root registry/hash, immutable CSS inventory,
CSS/component/install/registry/style-browser checks, actual qualification route,
installed-consumer helper, this report and preceding S133 checkpoint/projection/
report bookkeeping. Raw logs: `implementation/evidence/logs/s134-*.log`,
`logs/radio-install/`, `logs/generated-consumer/` and actual per-case installed
and source-paint artifacts. No failure, skip, blocker or scope deviation.
Original203 criteria/prior acceptance/parent/reference/remotes preserved.
Continue original S135; this complete registered candidate remains pending the
mandatory separate S148 acceptance before S149 and later MVP acceptance.
