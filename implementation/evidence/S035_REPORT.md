# S035 step report — Detect default SvelteKit application packages

Current disposition: implementation candidate committed pending independent
Codex review under the RCLD-03 batch. This report is Pi-authored evidence; Codex
alone assigns acceptance.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S035","kind":"report","commit":null,"disposition":"candidate"}
-->

Step ID and title: S035 — Detect default SvelteKit application packages.

Contract/requirement IDs: R05, R09, R15, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/API_CONTRACTS.md`,
`specs/GENERATED_LAYOUT.md`, `specs/SECURITY_AND_TRANSACTIONS.md`,
`specs/SYNCHRONIZATION.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `src/project/detect.ts` implements read-only default SvelteKit application
  detection. It reads `package.json` with `lstat`+`readFile` and inspects only
  the _presence_ of static `svelte.config.js|mjs|cjs|ts` evidence; it never
  executes `svelte.config.*`, a package script or application code.
- Detection identifies `@sveltejs/kit` in `dependencies`/`devDependencies` or a
  static config file. It resolves the frozen default interpretation
  (`src/lib/components/ui`, `src/styles`, `src/routes/+layout.svelte`) and
  reports `src/lib`/`src/routes`/layout presence as explicit booleans.
- A missing, invalid or symlinked manifest and a non-SvelteKit package return
  typed `PROJECT_MANIFEST_MISSING`, `PROJECT_MANIFEST_INVALID`,
  `PROJECT_MANIFEST_UNSAFE` and `PROJECT_NOT_SVELTEKIT` diagnostics instead of a
  guessed layout. Detection writes nothing.

## Files touched

- `src/project/detect.ts` — new module.
- `tests/integration/detect-default.test.ts` — new integration suite.
- `implementation/COMMIT_SEQUENCE.md` — S034 pending-review bookkeeping
  (recorded with this checkpoint).

## Verification

- `cargo extbuild run -- pnpm run test:integration -- tests/integration/detect-default.test.ts`
  — exit 0, 6/6, including complete-tree snapshot equality before/after
  detection.
- `cargo extbuild run -- pnpm run build` — exit 0.
- `cargo extbuild run -- pnpm run typecheck` — exit 0, five configs.
- `cargo extbuild run -- pnpm run check:contracts` — exit 0, 0 errors/0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Workspace selection/`--cwd` (S036) and explicit custom mappings/discovery
  (S037) remain open; this checkpoint only establishes the default
  interpretation.
