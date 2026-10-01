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

- `cargo extbuild run -- pnpm run test:integration -- tests/integration/peer-dependencies.test.ts`
  — exit 0, 6/6, including a snapshot purity control.
- `cargo extbuild run -- pnpm run test:unit -- tests/unit/dependency-plan.test.ts`
  — exit 0 (existing joint-range coverage preserved).
- `cargo extbuild run -- pnpm run build` — exit 0.
- `cargo extbuild run -- pnpm run typecheck` — exit 0, five configs.
- `cargo extbuild run -- pnpm run check:contracts` — exit 0, 0 errors/0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Manager-specific installation instruction rendering remains S040.
