# S190 implementation report — custom mappings and scoped workspaces

Author: Codex. Candidate; separate S193 acceptance remains required.
Implementation commit: `fa6a5f50f440a230490076bb3d27790000fba791`.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S190","kind":"report","commit":"fa6a5f50f440a230490076bb3d27790000fba791","disposition":"candidate"}
-->

## Implementation

`tests/integration/layout-matrix.test.ts` installs every real 22-item registry
catalog through the actual CLI in three explicit mappings: default,
outside-src UI/styles, and UI/styles paths containing spaces with a literal
nondefault SvelteKit routes mapping. Each owned application lives in a workspace
with a second SvelteKit application and an unrelated sentinel. Commands run
from the workspace root and select only the desired application with `--cwd`.

Each CLI invocation preserves the complete outside-selected tree, including
hidden entries, modes and link targets. Ambiguous root init fails without any
mutation. Every installed source matches its actual registry bytes and lock
base; full explicit root requests are recorded distinctly from dependencies.
Application theme and app CSS survive sync. Dry-run sync and strict doctor
preserve the entire selected tree. Actual Svelte check, production build and
owned-server SSR prove relative source/barrel/CSS/layout paths resolve, including
the static nondefault routes directory and multiple catalog instances.

The dynamic-config control imports filesystem code and would write a sentinel
if executed. Actual init, dry-run init, add, normal doctor and strict doctor
report the unsupported mapping and retain the exact complete tree; no sentinel
or transaction state appears. Normal doctor's zero warning exit is checked
together with `ready: false`; strict doctor fails. An initial assertion that
all doctor warnings exit nonzero was corrected to the existing documented
contract, with diagnostic log retained. A TypeScript inference annotation in
the new test was also corrected; no product source or dependency changed.

COMPATIBILITY.md records the bounded mapping evidence as a candidate rather
than claiming arbitrary dynamic layout, workspace-wide or platform support.

## Verification

Commands use extbuild after the green doctor/current guard. The measured lane
is Node 24.21.0, pnpm 11.22.0, pinned Svelte 5.57.1/Bits 2.19.3, macOS arm64.

- `node tools/run-unit-tests.mjs --suite integration tests/integration/layout-matrix.test.ts tests/integration/project-root.test.ts`: 20/20 passed (4 matrix and 16 root cases), zero skips; final owning run recorded in `logs/s190-integration-final.log`. Real layout artifacts/transcripts/check/build/SSR are retained under `logs/layout-matrix/`.
- `pnpm run fixture:check` found zero errors/warnings; `pnpm run fixture:build` passed. Final `pnpm run typecheck`, `pnpm run lint`, `pnpm run format:check`, `pnpm run check:contracts` and diff/staged review passed before the candidate commit.

No browser/product behavior changes require another browser full run; preceding
S189 owning 22 cases and S188 full 685 remain separately scoped evidence.
No Rust changes: Cargo guards N/A. Existing two pinned strict-declaration
exceptions and native boundaries remain explicit final AC20 obligations.
Reference source and unrelated work remain untouched; repository boundaries
are preserved. Only a verified
green commit enables S191; separate S193 acceptance gates S194.
