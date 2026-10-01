# S039 step report — Validate peer dependencies in the consumer plan

Current disposition: implementation candidate committed pending independent
Codex review under the RCLD-03 batch. This report is Pi-authored evidence; Codex
alone assigns acceptance.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S039","kind":"report","commit":"3e16d8f4874a4ca2699aa14d1fd818a3250afe25","disposition":"candidate"}
-->

Step ID and title: S039 — Validate peer dependencies in the consumer plan.

Contract/requirement IDs: R10, R12, R20, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/API_CONTRACTS.md`,
`specs/COMPONENT_CATALOG.md`, `specs/DATA_MODEL.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `src/project/dependencies.ts` gains `peerRequirementsFromPlan` and
  `validatePeerDependencies`. Peer requirements are derived from the resolved
  registry dependency plan (role `peer`) and de-duplicated by name, so a peer
  that one wrapper does not itself consume is still assessed.
- Each peer is combined with the selected package's actual declared/installed
  metadata. Non-ready peers produce typed `PEER_INCOMPATIBLE`,
  `PEER_NOT_INSTALLED` or `PEER_MISSING` diagnostics. No dependency is silently
  added.
- `implementation/evidence/COMPATIBILITY.md` records the exact peer-assessment
  fixture evidence, including the real Bits/Svelte/date ranges.

## Files touched

- `src/project/dependencies.ts` — peer plan extraction and validation.
- `tests/integration/peer-dependencies.test.ts` — new integration suite.
- `implementation/evidence/COMPATIBILITY.md` — S039 evidence addendum.
- `implementation/COMMIT_SEQUENCE.md` — S038 pending-review bookkeeping
  (recorded with this checkpoint).

## Verification

- `pnpm run test:integration -- tests/integration/peer-dependencies.test.ts`
  — exit 0, 6/6, including a snapshot purity control.
- `pnpm run test:unit -- tests/unit/dependency-plan.test.ts`
  — exit 0 (existing joint-range coverage preserved).
- `pnpm run build` — exit 0.
- `pnpm run typecheck` — exit 0, five configs.
- `pnpm run check:contracts` — exit 0, 0 errors/0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Manager-specific installation instruction rendering remains S040.

## RCLD-03 review 1 repair addendum (2026-10-01)

Independent review 1 reproduced that only pre-supplied peer-role entries were
filtered and actual installed upstream `peerDependencies` were never read, so a
runtime Bits 2.19.3 plan with missing date/Svelte peers returned success.
Repair commit 9ff4e5d combines registry peer requirements with the actual
installed upstream peer metadata, validates required peers even when a wrapper
does not import them, respects optional upstream peers only when the registry
does not require them, and never fabricates a successful audit from a missing
upstream installation. The repaired direct suite passes (peer-dependencies
10/10). See the `COMPATIBILITY.md` S039 repair addendum.

## RCLD-03 review-4 reconciliation

This report records the original checkpoint candidate named in its structured
evidence block. The composed planner was subsequently repaired under
independent review 4 (`implementation/COMMIT_SEQUENCE.md`, RCLD03-R4-1/2/3/4).
The authoritative reconciliation of actual scope, artifact identity,
intermediate failures, reruns and raw exits is
`implementation/evidence/RCLD03_R4_REPAIR.md` with the review-4 addendum in
`implementation/evidence/COMPATIBILITY.md`; the original acceptance criteria
are unchanged. This report is Pi implementation evidence, not acceptance.
