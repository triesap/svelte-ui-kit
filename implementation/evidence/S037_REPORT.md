# S037 step report — Freeze supported custom path mappings

Codex independently accepted this checkpoint at combined evidence anchor
`f46d60fbfb3457f4af66652d7f1bf99f7c725ff7` (see `S037_REVIEW.md` and `RCLD-03_QUALIFICATION.md`).
Original implementation `749296b4562aa9fa2e90b0a4632805bb4955af4d` remains provenance. This report is
Pi-authored evidence.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S037","kind":"report","commit":"f46d60fbfb3457f4af66652d7f1bf99f7c725ff7","disposition":"implemented"}
-->

Step ID and title: S037 — Freeze supported custom path mappings.

Contract/requirement IDs: R05, R16, R17, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/GENERATED_LAYOUT.md`,
`specs/SECURITY_AND_TRANSACTIONS.md`, `specs/STYLING.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `src/project/detect.ts` gains `discoverKitConfig`, a deterministic read-only
  walk for `<uiDir>/_kit/kit.json` below the selected package. The walk is
  sorted, excludes dependency/VCS/build-output directories and nested package
  roots, and never follows a symlink.
- Exactly one validated candidate whose location agrees with its declared
  `uiDir` selects a custom mapping resolved relative to the package. No
  candidate falls back to the default `src/lib/components/ui/_kit/kit.json`
  bootstrap. More than one valid candidate (`KIT_CONFIG_AMBIGUOUS`), a malformed
  candidate (`KIT_CONFIG_INVALID_JSON`) or a location/`uiDir` disagreement
  (`KIT_CONFIG_LOCATION_MISMATCH`) fails visibly.
- Discovery is JSON-only: `svelte.config.*` and package scripts are never
  executed. The frozen explicit `uiDir`/`stylesDir`/`layoutFile` fields remain
  the only supported custom mapping and no new flag or field is added.
- `specs/GENERATED_LAYOUT.md` documents the supported mapping, the discovery
  exclusions and the explicit manual fallback for unsupported dynamic or
  ambiguous SvelteKit configuration.

## Files touched

- `src/project/detect.ts` — discovery + `DiscoveredKitConfig`.
- `tests/integration/custom-paths.test.ts` — new integration suite.
- `specs/GENERATED_LAYOUT.md` — custom-mapping discovery documentation.
- `implementation/COMMIT_SEQUENCE.md` — S036 pending-review bookkeeping
  (recorded with this checkpoint).

## Verification

- `pnpm run test:integration -- tests/integration/custom-paths.test.ts`
  — exit 0, 7/7, including snapshot purity and a `svelte.config.js` that throws
  only if executed.
- `pnpm run test:unit -- tests/unit/path-overlap.test.ts`
  — exit 0.
- `pnpm run build` — exit 0.
- `pnpm run typecheck` — exit 0, five configs.
- `pnpm run check:contracts` — exit 0, 0 errors/0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Dependency inspection and instructions remain S038–S040.

## RCLD-03 review 1 repair addendum (2026-10-01)

Independent review 1 reproduced that a symlink/directory at `_kit/kit.json`
silently fell back to default bootstrap. Repair commit 69ce8ed observes `_kit`
entries and `kit.json` kinds deliberately and returns typed
unsafe/nonregular/unreadable causes, and replaces the imaginary "pass a
mapping" guidance with supported reconciliation steps. The repaired direct
suite passes (custom-paths 10/10).

## RCLD-03 review-4 reconciliation

This report records the original checkpoint candidate named in its structured
evidence block. The composed planner was subsequently repaired under
independent review 4 (`implementation/COMMIT_SEQUENCE.md`, RCLD03-R4-1/2/3/4).
The authoritative reconciliation of actual scope, artifact identity,
intermediate failures, reruns and raw exits is
`implementation/evidence/RCLD03_R4_REPAIR.md` with the review-4 addendum in
`implementation/evidence/COMPATIBILITY.md`; the original acceptance criteria
are unchanged. This report is Pi implementation evidence, not acceptance.
