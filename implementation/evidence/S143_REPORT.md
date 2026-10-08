# S143 step report — Style and register Collapsible

Author: Codex. Independently accepted on code `aec5711b9d3368b1cc1f0416bca7f2f0ce5aa0a5` at evidence `bd2613c050c37cd883d4e2155a6eb264ce66c484`.
Original implementation commit: `68577a42f1c210181060e9e347becb59a1f3ef05`. The candidate narrative below
is historical implementation and verification provenance.
Implementation commit: `68577a42f1c210181060e9e347becb59a1f3ef05`.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S143","kind":"report","commit":"bd2613c050c37cd883d4e2155a6eb264ce66c484","disposition":"implemented"}
-->

Original R04, R06, R14, R26, R32, R33, R34. Starting
`2481d939dad27b3eda6c4da1569496082a9461c3` on `master`.

Register exactly five source files, six flat value/type exports and one complete
Collapsible source/style cohort. Dependencies are tokens and pinned Bits2.19.3.
The index exposes the three frozen part/type pairs. Preserve native retained
content, state attributes and presence behavior; introduce no transition engine.

Immutable CSS inventory checks all 20 parsed source declarations against mapped
selectors and values, with actual source identity. Preserve all 16 source hooks;
append 15 metadata records while leaving the original 213 records unchanged.
The total is 228 unique records. Tokens0.1.8 records only that metadata addition;
semantic defaults and token CSS remain unchanged. Consumer metadata is an exact
generated projection. The original radius retains its existing fallback chain.

Real built CLI default/custom installation qualifies exact source bytes, bases,
closure, exports, coinstalled Dialog, zero-effect dry runs, strict doctor, complete
replay and check/build/SSR. A package missing Content refuses installation before
consumer effects. Local source comments and CSS radius changes survive sync;
only stylesheet-v1 aggregate bookkeeping follows effective CSS, with all adoption
bases and other lock records unchanged. Subsequent sync preserves the whole tree.

Installed Chromium checks source spacing, trigger minimum height/padding/radius,
content presence/padding, native focus ring, expanded relationships and disabled
paint. Custom elliptical radius, background, spacing and padding remain effective
under RTL and reduced motion. Native measurement styles and actual geometry are
retained as evidence; plain CSS does not imply absence of runtime inline styles.

Initial install 5/7 failed incorrect requested-ID ordering expectations; the
canonical order is collapsible then dialog. Initial styles 2/4 failed an authored
inline-flex versus computed flex expectation. An independent native DOM control
demonstrates grid blockification and supplies the computed comparison. Both
harness expectations were corrected without changing source CSS or wrappers.
Fresh owning lanes pass with no suppressed failure or omitted case.

Verification through `cargo extbuild run --` after green doctor, Node24.21.0:

- `pnpm run build`: exit0; actual CLI artifact.
- `node tools/run-unit-tests.mjs --suite integration tests/integration/collapsible-install.test.ts tests/integration/tokens-install.test.ts`: final 7/7, exit0.
- `pnpm exec playwright test --config playwright.config.ts tests/browser/collapsible-styles.spec.ts`: fresh 4/4, exit0; default/custom actual CLI consumers.
- `node tools/run-unit-tests.mjs --suite components tests/components/collapsible-types.test.ts tests/components/collapsible-parts.test.ts tests/components/collapsible-css.test.ts`: 18/18, exit0.
- `pnpm run test:registry`: 52/52, exit0; all 16 hooks match actual CSS and worksheet.
- `pnpm run test:package`: 3/3, exit0; actual offline package inventory/runtime.
- `pnpm run fixture:check`, `pnpm run fixture:build`: exit0; zero errors/warnings and real adapter output.
- `pnpm run typecheck`, `pnpm run lint`, `pnpm run format:check`, `pnpm run check:contracts`: exit0.
- Original 213 metadata records, semantic defaults and all 203 checkpoint definitions preserved. Diff/staged review and checks pass. Conditional Cargo N/A.

Files: complete Collapsible index/manifest/CSS and root hash; source CSS inventory;
metadata and fixture projection; worksheet; owning component/install/style/registry
checks; installed-consumer helper/route; this report and S142 bookkeeping.
Raw logs: `implementation/evidence/logs/s143-*.log`, `logs/collapsible-install/`,
`logs/generated-consumer/` and actual per-case artifacts.
No remaining failure, blocker or scope deviation. Repository boundaries and
accepted criteria remain intact. Continue original S144 after the green commit;
separate S148 and full MVP acceptance remain open.
