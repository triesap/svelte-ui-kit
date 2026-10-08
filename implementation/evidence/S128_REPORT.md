# S128 step report — installed Menu floating, themes, CSP and lifecycle

Author: Codex. Candidate; mandatory separate RCLD-07 acceptance pending.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S128","kind":"report","commit":"21c72d21fd78a34f12099b94b0d4fddff779d911","disposition":"candidate"}
-->

Requirements R21, R23, R24, R26, R29, R32, R33, R34. Starting `06421d7` on
`master`. Actual CLI-installed default/custom output qualifies native floating
placement, live themes, adverse clipping, open/closed hydration, request-local
state/identity and dynamic cleanup. The helper optionally prepares an owned
application before its actual check/build, used for real CSP configuration and
a real missing-cleanup observer mutation; authoring/package/reference sources
are never changed by those controls.

All commands ran from repository root via `cargo extbuild run --` after green
doctor, Node24.21.0/pnpm11.22.0/Svelte5.57.1/Bits2.19.3:

- `pnpm exec playwright test --config playwright.config.ts tests/browser/menu-placement.spec.ts tests/browser/menu-csp.spec.ts tests/browser/menu-lifecycle.spec.ts`: final32/32 Chromium, exit0. Twenty placement/hydration cases, eight real enforced-CSP/no-JS/hydrated policy cases, four real observer lifecycle/causal-negative cases, across default/custom installed layouts.
- `node tools/run-unit-tests.mjs --suite integration tests/integration/menu-ssr.test.ts`:2/2, exit0. Forty concurrent/repeated production responses share one worker per layout, body/inline/custom portal, alternating initial state, isolated second instance and direct pinned native SSR control. Full production hashes and executed handler identity retained before assertions.
- `pnpm run typecheck`, `pnpm run lint`, `pnpm run format:check`, `pnpm run fixture:check`, `pnpm run fixture:build`, `pnpm run check:contracts`:exit0; final lint/format/fixture/contracts after qualification files. Maintained Svelte zero errors/warnings and real Node-adapter build.
- `git diff --check`, staged check and all203 original definition comparison against `a176387`:exit0.

Placement measures actual bottom/start/4px geometry, ancestor scroll tracking,
viewport collision padding/top flip, actual native custom Element host, body/
inline/custom open/closed hydration and unique instance IDs. Body portals inherit
document theme; custom hosts inherit nested theme; both update live while open
without inline kit-token copying. A transformed overflow-hidden custom host is
causally clipped and documented. Dynamic items leave/rejoin native navigation;
actual Content replacement/Root destruction update refs and disconnect old nodes.

Native ResizeObserver instrumentation records real observed elements and their
lifetimes across replacement/destruction. Correct output retains no disconnected
targets and releases all first-root floating targets on teardown. The owned
negative adds an actual observer without cleanup to copied application Content;
it retains disconnected Content nodes and proves the detector catches missing
cleanup. Production code/installed source hashes and mutation disposition are
captured before assertions. No kit state or positioning engine is added.

The CSP fixture changes actual owned SvelteKit configuration and inspects actual
Node response policy. Nonce script and self-hosted stylesheet policies are kept;
style-src-attr permits attributes or denies them. No-JS responses with allowed
attributes preserve native absolute outer geometry; denying attributes emits
explicit style-src-attr refusal errors and leaves SSR outer position static.
Hydrated requests preserve actual native runtime attributes and record measured
geometry/diagnostics. Strict-policy expected errors are captured, attached and
individually matched; unrelated errors, warnings and page exceptions fail.
Allow-attribute cases have no errors. Hydrated recovery cannot establish strict
no-inline server parity. README/worksheet state this measured support and limit;
no geometry is stripped and no SSR switch introduced in product output.

Raw logs: `implementation/evidence/logs/s128-*.log`, application check/build/
full production hashes under `logs/generated-consumer/`, forty retained SSR
responses under `logs/menu-ssr/`; final browser attachments include actual
policy/geometry/errors and observer lifetimes. Initial placement run was
interrupted130 after fixture pointer overlap; keyboard activation makes the
second-instance probe independent of the first menu's actual overlap. Two
initial concurrent Playwright invocations shared the output tree and damaged
some transient trace copies. Final single combined invocation reran all three
lanes sequentially with fresh retained artifacts. Initial lint caught unused
page fixture; final corrected harness checks actual page lifetime. Initial
failed/interrupted runs are retained and never claimed green.

Self-review: installed qualification/docs/helpers and predecessor bookkeeping
only. No tests skipped, reference/parent index/remote changes. Cargo N/A in this
TS-only target. Precisely qualified upstream declaration/reference exceptions,
later catalog/platform/final package/release obligations remain open. Pinned
textValue search limit retains actual candidate/native evidence from S127 for
independent assessment. This report supplies no self-acceptance.

Commit subject: `test: qualify menu placement themes and csp limits`. Freeze its
real SHA and all13 pending rows for a separate reviewer to assess original
S116–S128 criteria and causal controls. No S129 implementation before that gate.
