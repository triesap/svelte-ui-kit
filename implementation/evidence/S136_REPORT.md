# S136 step report — Exact Tabs value, activation and panel contract

Author: Codex. Locally verified candidate; independent S148 acceptance pending.
Implementation commit: `23bcfaaa3dad6a0e43557b8e4536bb28bfaf38e8`.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S136","kind":"report","commit":"23bcfaaa3dad6a0e43557b8e4536bb28bfaf38e8","disposition":"candidate"}
-->

Original R03, R20, R21, R22, R26, R32, R33, R34. Starting
`e00898ce42c2f7d9bce6683416e815fe81c70c9b` on `master`.

Read immutable source Root/List/Trigger/Panel, manifest and full CSS, governing
API/catalog/architecture and actual pinned Bits2.19.3 public types, components
and state. The worksheet freezes exactly TabsRoot/List/Trigger/Content and four
matching type exports, six sibling sources and one managed CSS asset/cohort.
Content maps source Panel with kit-tabs-panel; no extra alias, Rust enum ABI or
numeric-index engine. Only tokens/pinned Bits dependencies are justified.

Props alias actual native types with no widening: string value binding/callback,
actual HTMLElement refs, orientation, automatic/manual activation, loop,
disabled, native DOM dir, attrs/classes/styles/handlers and both rendering hooks.
Trigger/Content require matching string values. Always-mounted native Content
uses hidden on inactive DOM and retains its children/state; invented forceMount
and presence callbacks are rejected. Native request-local identities and dynamic
registration own relationships, with actual SSR/hydration observations required
in subsequent candidates rather than promised from types.

Source Wrap and actual pinned Root default loop=true agree; the pinned type's
loop=false comment is inconsistent with its implementation. Document that
bounded discrepancy explicitly and preserve actual native implementation.
Four parts remain unadvertised until complete S139 registration. Later S137,
S138 and S140 still own implementation/browser obligations and separate S148
acceptance remains mandatory.

Verification through `cargo extbuild run --` after green doctor, Node24.21.0:

- `node tools/run-unit-tests.mjs --suite components tests/components/tabs-types.test.ts`: final 16/16, exit0; one complete native positive fixture and 15 causal invalid fixtures, no library diagnostic suppression. Initial 15/16 failed because TypeScript reports invalid capitalized activation as TS2820 with a spelling suggestion; the detector now recognizes that real assignment error alongside the other exact diagnostic codes.
- `pnpm run fixture:check`: exit0, maintained fixture zero errors/warnings.
- `pnpm run typecheck`, `pnpm run lint`, `pnpm run format:check`, `pnpm run check:contracts`: exit0.
- `git diff --check`, staged diff review/check: exit0; conditional Cargo N/A.

Files: exact Tabs aliases, source/native API worksheet, owning type fixtures,
this report and previous S135 checkpoint/projection/report bookkeeping. Logs:
`implementation/evidence/logs/s136-*.log`. No remaining failure, blocker, ignored
issue or scope deviation. Build/package/browser lanes are not introduced by this
type-only checkpoint; actual candidate app check/build follows S137. Original
203 definitions and all prior accepted evidence remain intact. Continue original
S137 Root/List after the green commit; no independent or full MVP completion
claim is made here.
