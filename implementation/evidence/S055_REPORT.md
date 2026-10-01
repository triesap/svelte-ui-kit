# S055 step report — Identify safe Svelte layout edit spans

Current disposition: implementation candidate committed pending independent
Codex review under the RCLD-03 batch. This report is Pi-authored evidence; Codex
alone accepts.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S055","kind":"report","commit":"eb78d5f73fcdc78eaf6ece51f3cb80184573d645","disposition":"candidate"}
-->

Step ID and title: S055 — Identify safe Svelte layout edit spans.

Contract/requirement IDs: R17, R20, R21, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/API_CONTRACTS.md`,
`specs/ARCHITECTURE.md`, `specs/COMPONENT_CATALOG.md`,
`specs/GENERATED_LAYOUT.md`, `specs/STYLING.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`.

## Scope implemented

- `src/codegen/svelte-parse.ts` uses the pinned Svelte 5.57.1 compiler to parse a
  layout without executing it and returns the exact instance/module script
  content spans plus the existing import specifiers.
- No-script, instance, TypeScript-instance, module-only and commented layouts
  are classified. Unsupported/ambiguous syntax is a typed
  `LAYOUT_PARSE_UNSUPPORTED` failure. Parsing never mutates the source.

## Dependency note

- The already-approved exact `svelte` 5.57.1 runtime promotion is applied now
  because the parser becomes a production import here (decision 4). No other
  dependency or version changes; `typescript` 6.0.3 was promoted at S035.

## Files touched

- `package.json`, `pnpm-lock.yaml` — svelte moved to runtime dependencies.
- `src/codegen/svelte-parse.ts` — new module.
- `tests/unit/svelte-layout-parse.test.ts` — new unit suite.
- `implementation/evidence/S054_REPORT.md` and `implementation/COMMIT_SEQUENCE.md`
  — S054 pending-review bookkeeping (recorded with this checkpoint).

## Verification

- `pnpm run test:unit -- tests/unit/svelte-layout-parse.test.ts`
  — exit 0, 7/7.
- `pnpm run typecheck` — exit 0, five configs.
- `pnpm run check:contracts` — exit 0, 0 errors/0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Minimal stylesheet import patching remains S056.

## RCLD-03 review-4 reconciliation

This report records the original checkpoint candidate named in its structured
evidence block. The composed planner was subsequently repaired under
independent review 4 (`implementation/COMMIT_SEQUENCE.md`, RCLD03-R4-1/2/3/4).
The authoritative reconciliation of actual scope, artifact identity,
intermediate failures, reruns and raw exits is
`implementation/evidence/RCLD03_R4_REPAIR.md` with the review-4 addendum in
`implementation/evidence/COMPATIBILITY.md`; the original acceptance criteria
are unchanged. This report is Pi implementation evidence, not acceptance.
