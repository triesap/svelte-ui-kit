# S182 implementation report — public exports and dependency direction

Author: Codex. Independently accepted on code `abeccabbdfda5aedb7be4f72e3b51a4675d3a609` at evidence `8ab760dc4d674853b172126b2a3ec3a0434c678f`.
Original implementation commit: `fba6d1f727a7adbc111fa1c2fb8da410b43215aa`. The candidate narrative below
is historical implementation and verification provenance.
Implementation commit: `fba6d1f727a7adbc111fa1c2fb8da410b43215aa`.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S182","kind":"report","commit":"8ab760dc4d674853b172126b2a3ec3a0434c678f","disposition":"implemented"}
-->

## Change and observed behavior

`tests/registry/public-exports.test.ts` audits every complete catalog declaration,
its target, public name and value/type direction. Actual TypeScript emission
retains precisely the value exports and erases the types. The real CLI-installed
default and custom layouts in `tests/integration/consumer-imports.test.ts` both
check and build all advertised symbols. Each exposes 129 public declarations:
60 values and 69 types. Each actual installed graph has 340 import edges across
90 modules with imports. Its only external specifiers are `svelte`,
`svelte/elements` and `bits-ui`; no styled kit runtime is needed.

`tests/helpers/consumer-graph.ts` parses actual Svelte instance/module scripts
and TypeScript syntax, including re-exports, mixed type imports, import types,
dynamic imports and require calls. Local edges must resolve inside the app-owned
source graph. Root-barrel back edges and runtime cycles fail. Opaque dynamic
loads, Node/CLI/kit-runtime dependencies, unresolved escaped paths and extra
styled dependencies fail. Causal mutations exercise those failures; ordinary
import-looking prose remains valid. Root symbols retain manifest authority;
no parallel namespace export or unnecessary component barrel was introduced.

Retained evidence under `implementation/evidence/logs/consumer-imports/`
records actual installed source digests, declarations, graph edges and emitted
runtime exports for both layouts. Product templates and public APIs did not
require changes.

## Verification

All commands used the configured build router and exited 0:

- `node tools/run-unit-tests.mjs --suite registry tests/registry/public-exports.test.ts`: 2/2.
- `node tools/run-unit-tests.mjs --suite integration tests/integration/consumer-imports.test.ts`: 2/2; real default/custom check/build.
- `pnpm run fixture:check`: zero errors and warnings.
- `pnpm run fixture:build`: production build passed.
- `pnpm run format:check`, `pnpm run lint`, `pnpm run typecheck`: passed.
- `node tools/check-contracts.mjs`: passed after report formatting.
- `git diff --check`, staged whitespace and content review: passed before commit.

Raw owning logs use the `s182-` prefix. Conditional Rust checks are N/A: this
checkpoint changes TypeScript qualification and no Rust workspace. Existing
qualified strict-declaration exceptions remain explicit; these results do not
claim universally clean upstream declarations. Final platform/package/AC20
and full MVP acceptance remain open. No original criterion was changed.

Next original checkpoint is S183, cross-family bindings, refs and delegation.
S182 is author-verified and awaits the separate S193 sequence gate.
