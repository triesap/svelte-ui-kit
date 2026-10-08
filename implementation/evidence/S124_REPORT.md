# S124 step report — Menu Portal and floating Content

Author: Codex. Candidate; separate S128/RCLD-07 acceptance pending.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S124","kind":"report","commit":null,"disposition":"candidate"}
-->

Requirements R20, R21, R23, R24, R32, R33, R34. Starting code `a0050fe` on
`master`. Portal forwards exact native disabled/Element/string host/children
props. Content binds the actual native HTMLElement ref and merges its inner
kit/caller classes while forwarding both child/default snippets unchanged.
Source defaults are bottom/start/sideOffset4/collisionPadding8; explicit native
side/align/strategy/collision and other options remain forwarded. No DOM globals,
positioning engine, runtime style stripping or extra catalog parts are added.

Owned incremental candidate-copy fixtures now include Portal/Content. Default
rendering uses the native outer floating wrapper and inner content. Delegated
rendering spreads wrapperProps onto an article and props onto a section; kit
classes remain on the inner element. Actual refs, native runtime styles,
position transforms, portal hosts, SSR and override geometry are exercised.

All validation ran from the repository root through `cargo extbuild run --`,
after green doctor, using pinned Node24.21.0/pnpm11.22.0/Svelte5.57.1/Bits2.19.3:

- `node tools/run-unit-tests.mjs --suite components tests/components/menu-content.test.ts`: final 1/1, exit0; four retained actual production SSR responses, default inline/pinned portal omission and delegated two-element structure, role/classes/state/direction/runtime styles, executed handler hashes.
- `pnpm exec playwright test --config playwright.config.ts tests/browser/menu-candidate.spec.ts`: final 14/14 Chromium, exit0. Eight S123 regressions plus four actual Portal modes, delegated refs/structure/state and native top/end/fixed/12px offset override.
- `pnpm run typecheck`, `pnpm run lint`, `pnpm run format:check`, `pnpm run fixture:check`, `pnpm run fixture:build`, `pnpm run check:contracts`: exit0, maintained Svelte check zero errors/warnings and real Node-adapter build.
- `git diff --check` and staged diff check: exit0.

Raw logs: `implementation/evidence/logs/s124-*.log`; application check/build,
source/full production inventories and executed SSR response identities under
`implementation/evidence/logs/menu-candidate/`. The first browser run passed
13/14 and exposed an incorrect forceMount fixture expectation. Pinned floating
forceMount preserves rendered nodes rather than owning closed visibility. The
application's delegated article now uses hidden={!open} from the native snippet;
no wrapper behavior, test enforcement or acceptance criterion was weakened.

Self-review preserves wrapper/inner attachments and style ownership, predecessor
bookkeeping, one live batch and all original checkpoint definitions. No tests
skipped; conditional Cargo N/A in this TS-only target. Existing precisely
qualified upstream declaration/reference exceptions remain AC20 debt. Installed
family selection/nesting/themes/CSP/platform acceptance is still pending; this
candidate does not establish it. No reference source or parent index changes.

Commit subject: `menu: preserve floating content and portal structure`. Actual
SHA follows the green commit. S125 is safe after that commit within the exact
RCLD-07 batch; S129 remains gated by separate S128 acceptance.
