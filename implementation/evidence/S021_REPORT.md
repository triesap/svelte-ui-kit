# S021 step report — Define portable theme and customization metadata schemas

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S021","kind":"report","commit":"6bb1f2564786dd1e5f3f5d65750b22abdf17c9b0","disposition":"candidate"}
-->

Step ID and title: S021 — Define portable theme and customization metadata schemas.

Contract/requirement IDs: R07, R12, R23, R25, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/DATA_MODEL.md`,
`specs/STYLING.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.
This commit also records the bookkeeping that moves S020 to
`committed_pending_review`.

## Scope implemented

- `schema/v1/token-contract.schema.json` defines semantic token names
  (`--kit-*`), roles, types, the three named layers and the structural
  `radiusGrammar` declaration (four corners, elliptical, slash form) so the full
  border-radius grammar cannot be narrowed by accident.
- `schema/v1/component-customization.schema.json` defines separately versioned
  per-component runtime properties with scope/grammar/fallback.
- `schema/v1/theme-integration.schema.json` defines stylesheet, layer order,
  producer (`svelte-ui-kit`), compatibility ranges, actual portal strategies and
  the token-contract reference.
- `src/registry/theme.ts` parses all three, cross-checks the referenced token
  contract id/version and the layer set, rejects duplicate customization
  properties and rejects any Rust/Leptos/wasm/ABI identifier in portable
  Svelte metadata.

## Files changed or added

| Path                                                                          | Change   | Purpose                           |
| ----------------------------------------------------------------------------- | -------- | --------------------------------- |
| `schema/v1/token-contract.schema.json`                                        | new      | Token/layer/radius contract.      |
| `schema/v1/component-customization.schema.json`                               | new      | Runtime property contract.        |
| `schema/v1/theme-integration.schema.json`                                     | new      | Theme/portal integration.         |
| `src/registry/theme.ts`                                                       | new      | Parsing + cross-check + Rust ban. |
| `tests/unit/theme-metadata.test.ts`                                           | new      | S021 direct tests.                |
| `implementation/COMMIT_SEQUENCE.md`, `implementation/evidence/S020_REPORT.md` | modified | Record S020 pending review.       |

## Verification

| Check                 | Command                                                   | Exit | Result          |
| --------------------- | --------------------------------------------------------- | ---- | --------------- |
| Direct lane           | `pnpm run test:unit -- tests/unit/theme-metadata.test.ts` | 0    | 5 tests, 5 pass |
| Typecheck (4 configs) | `pnpm run typecheck`                                      | 0    | exit 0          |
| Format / lint         | `pnpm run format:check`, `pnpm run lint`                  | 0    | clean           |
| Contract validation   | `pnpm run check:contracts`                                | 0    | 0/0             |
| Whitespace            | `git diff --check`                                        | 0    | no diagnostics  |

## Self-review findings

- Inconsistent contract ids, mismatched layer sets, narrowed radius grammar,
  unknown roles and Rust/wasm/ABI claims all fail deterministically.
- Theme metadata is descriptive CSS intent; no runtime theme store or inline
  style injection is claimed.

## Limitations

- Actual CSS parsing/computed-style verification is a later component sequence.
  Pending independent Codex review.
