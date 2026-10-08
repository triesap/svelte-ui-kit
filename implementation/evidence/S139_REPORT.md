# S139 step report — Complete styled Tabs installation

Author: Codex. Locally verified candidate; independent S148 acceptance pending.
Implementation commit will be recorded after the green commit.

Original R04, R06, R14, R26, R32, R33, R34. Starting
`27d84f097ea94a1a62cf6d3ca2d68dbf93ff7710` on `master`.

Tabs registers exactly six source files, eight flat value/type exports and one
managed style block, all in one complete tabs cohort. Only tokens and pinned
Bits2.19.3 dependencies. Sibling index exports match actual Root/List/Trigger/
Content and exact types; no partial catalog family, compatibility aliases or
separate identity engine.

Compiler-parsed immutable inventory compares all 31 source declarations and
actual source SHA256 against mapped CSS. Source active/inactive, orientation,
trigger/panel, hover/focus/disabled, spacing and radius rules use actual native
DOM. Preserve all 24 Tabs customization hooks; add 23 observed hooks to independent
metadata while keeping all prior 190 records exactly unchanged. Metadata now
contains 213 unique records. Tokens0.1.7 records that addition; semantic contract,
all semantic defaults and token CSS are unchanged. Exact generated fixture
metadata remains projected from registry authority. Existing radius keeps its
control/default/md chain and full radius grammar.

Real built CLI default/custom installs qualify inventory/source bytes/bases,
dependency closure, flat/coinstalled Dialog exports, zero-effect dry run,
check/build/SSR, strict doctor and unchanged replay. An owned package missing
required Content refuses add before consumer effects. Actual source/CSS/lock,
type fixture/handler/check/build/response artifacts are retained. Local source
comment and managed CSS radius customization survive dry run, sync and strict
doctor byte-for-byte; all adoption bases/owner/lineage fields remain exact.
Only stylesheet-v1 aggregate bookkeeping follows actual effective CSS hash.
The next sync preserves the whole tree including the satisfied lock.

Actual installed Chromium default/custom measures grid/flex gaps, minimum
height/padding, selected/hidden panels, active/inactive attributes, disabled
opacity/cursor, native focus ring, vertical list alignment and control-radius
precedence. Exact elliptical radius, selected background, spacing and panel
padding overrides remain live under RTL/reduced motion. Actual paint/geometry,
installed source and all production identities are retained. Original S140 owns
the full installed keyboard/dynamic/hydration qualification.

Initial install 0/7 and style setup failures identified missing required empty
accessibility.form metadata. Added the array without weakening the schema.
Corrected two metadata grammar assignments and hook inventory/table handling
before final qualification. Next install run 5/7 and the retained targeted
probe failed only the overstrict expectation of unchanged aggregate lock hash.
Source inspection and actual before/after locks show only stylesheet-v1
bookkeeping changes; the final detector requires that exact effective hash,
unchanged asset bases/all other records and complete satisfied replay. No core
product repair, suppression or skipped case.

Verification through `cargo extbuild run --` after green doctor, Node24.21.0:

- `pnpm run build`: exit0, actual CLI artifact.
- `node tools/run-unit-tests.mjs --suite integration tests/integration/tabs-install.test.ts tests/integration/tokens-install.test.ts`: final 7/7, exit0; four Tabs and three token cases.
- `pnpm exec playwright test --config playwright.config.ts tests/browser/tabs-styles.spec.ts`: fresh 4/4 Chromium, exit0; actual default/custom CLI consumers.
- `node tools/run-unit-tests.mjs --suite components tests/components/tabs-css.test.ts tests/components/tabs-types.test.ts tests/components/tabs-parts.test.ts tests/components/tabs-root-list.test.ts`: 19/19, exit0.
- `pnpm run test:registry`: 51/51, exit0; all 24 hooks/fallbacks match actual CSS and worksheet.
- `pnpm run test:package`: 3/3, exit0; actual offline tarball inventory/runtime.
- `pnpm run fixture:check`, `pnpm run fixture:build`: exit0; maintained fixture zero errors/warnings and real Node-adapter output.
- `pnpm run typecheck`, `pnpm run lint`, `pnpm run format:check`, `pnpm run check:contracts`: exit0.
- Original 190 customization records/semantic defaults preserved; original 203 checkpoint definitions unchanged. `git diff --check`, staged diff review/check: exit0; conditional Cargo N/A.

Files: complete Tabs index/manifest/CSS and root hash, immutable CSS inventory,
metadata/token version/exact fixture projection, measured worksheet, owning CSS/
install/style-browser/registry checks and installed-consumer helper/route, this
report and preceding S138 bookkeeping. Raw logs: `implementation/evidence/logs/s139-*.log`,
`logs/tabs-install/`, `logs/generated-consumer/` and actual per-case artifacts.
No remaining failure, blocker, ignored issue or scope deviation. Parent index,
source identity and accepted criteria remain intact. Continue original S140
after this green commit; separate S148 and full MVP acceptance remain open.
