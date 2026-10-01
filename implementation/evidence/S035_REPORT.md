# S035 step report — Detect default SvelteKit application packages

Current disposition: implementation candidate committed pending independent
Codex review under the RCLD-03 batch. This report is Pi-authored evidence; Codex
alone assigns acceptance.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S035","kind":"report","commit":"453434a0a1019795e85034c22f08a32fb70802a9","disposition":"candidate"}
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

- `pnpm run test:integration -- tests/integration/detect-default.test.ts`
  — exit 0, 6/6, including complete-tree snapshot equality before/after
  detection.
- `pnpm run build` — exit 0.
- `pnpm run typecheck` — exit 0, five configs.
- `pnpm run check:contracts` — exit 0, 0 errors/0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Workspace selection/`--cwd` (S036) and explicit custom mappings/discovery
  (S037) remain open; this checkpoint only establishes the default
  interpretation.

## RCLD-03 review 1 repair addendum (2026-10-01)

Independent review 1 reproduced that a non-SvelteKit Svelte package with a
`svelte.config` file was accepted, dynamic/custom routes were ignored and the
first of several config files was chosen silently. Repair commit 69ce8ed
requires declared `@sveltejs/kit` evidence, statically inspects exactly one
config through the pinned TypeScript AST (no execution), honors literal
`kit.files.routes`/`kit.files.lib`, and returns typed ambiguity/dynamic
diagnostics with manual reconciliation steps. The repaired direct suite passes
(detect-default 12/12).

## RCLD-03 review-4 reconciliation

This report records the original checkpoint candidate named in its structured
evidence block. The composed planner was subsequently repaired under
independent review 4 (`implementation/COMMIT_SEQUENCE.md`, RCLD03-R4-1/2/3/4).
The authoritative reconciliation of actual scope, artifact identity,
intermediate failures, reruns and raw exits is
`implementation/evidence/RCLD03_R4_REPAIR.md` with the review-4 addendum in
`implementation/evidence/COMPATIBILITY.md`; the original acceptance criteria
are unchanged. This report is Pi implementation evidence, not acceptance.
