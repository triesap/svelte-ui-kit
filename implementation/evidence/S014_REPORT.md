# S014 step report — Freeze and validate strict kit configuration

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S014","kind":"report","commit":"1dd359fbbd87e846d47558615a003659396ba7bc","disposition":"candidate"}
-->

Step ID and title: S014 — Freeze and validate strict kit configuration.

Contract/requirement IDs: R05, R09, R11, R12, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/API_CONTRACTS.md`,
`specs/DATA_MODEL.md`, `specs/GENERATED_LAYOUT.md`,
`specs/SYNCHRONIZATION.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. This checkpoint adds the
approved exact runtime dependency `ajv` 6.15.0. It also records the
bookkeeping that moves S013 to `committed_pending_review`.

## Scope implemented

- `schema/v1/kit.schema.json` is a local draft-07 schema with the fixed URN
  `urn:svelte-ui-kit:schema:v1:kit`, `additionalProperties: false`, the exact
  top-level spelling (`schemaVersion`, `toolVersion`, `registry`, `uiDir`,
  `stylesDir`, `layoutFile`, `requested`), the literal `registry: "builtin"`,
  `schemaVersion` exactly `1` and lowercase kebab-case unique request IDs.
- `src/registry/schema.ts` compiles local schemas with Ajv 6.15.0 using
  `coerceTypes: false`, `useDefaults: false` and `removeAdditional: false`, so
  unknown fields, bad types and unsupported versions fail instead of being
  coerced, defaulted or stripped. The package root is discovered by walking up
  for `package.json`, which works in both the emitted `dist/` tree and the
  mirrored unit/integration build trees without a CWD dependency (S025 later
  replaces this with the hardened asset provider).
- `src/project/config.ts` validates + normalizes `kit.json`: absent optional
  fields receive the documented defaults `src/lib/components/ui`,
  `src/styles`, `src/routes/+layout.svelte` and `[]`; `deriveKitPaths` fixes the
  non-configurable `_kit`, `index.ts` and `kit/themes/app.css` derivations. No
  Svelte/Leptos configuration is executed and the legacy Leptos shape is
  rejected by design.

## Files changed or added

| Path                                                                          | Change   | Purpose                                    |
| ----------------------------------------------------------------------------- | -------- | ------------------------------------------ |
| `schema/v1/kit.schema.json`                                                   | new      | Strict local config schema.                |
| `src/registry/schema.ts`                                                      | new      | Local draft-07 compile/validate boundary.  |
| `src/project/config.ts`                                                       | new      | Strict config parse/defaults/derivations.  |
| `tests/unit/config.test.ts`                                                   | new      | S014 direct tests.                         |
| `tsconfig.json`                                                               | modified | Enable CJS default-import interop for ajv. |
| `package.json`, `pnpm-lock.yaml`                                              | modified | Add the approved `ajv` 6.15.0 pin.         |
| `implementation/COMMIT_SEQUENCE.md`, `implementation/evidence/S013_REPORT.md` | modified | Record S013 pending review.                |

## Verification

| Check                 | Command                                             | Exit | Result                      |
| --------------------- | --------------------------------------------------- | ---- | --------------------------- |
| Dependency install    | `pnpm install`                                      | 0    | ajv 6.15.0 added            |
| Direct lane           | `pnpm run test:unit -- tests/unit/config.test.ts`   | 0    | 9 tests, 9 pass             |
| Regression            | `pnpm run test:unit -- tests/unit/versions.test.ts` | 0    | 9 tests, 9 pass             |
| Typecheck (4 configs) | `pnpm run typecheck`                                | 0    | exit 0                      |
| Format                | `pnpm run format:check`                             | 0    | all matched files formatted |
| Lint                  | `pnpm run lint`                                     | 0    | no findings                 |
| Contract validation   | `pnpm run check:contracts`                          | 0    | 0 error(s), 0 warning(s)    |
| Whitespace            | `git diff --check`                                  | 0    | no diagnostics              |

## Failed attempts

- The first `typecheck` rejected `import Ajv from "ajv"` because Ajv 6's
  `export =` is a constructable value, not a namespace. The loader now uses
  `createRequire` with a minimal local interface, keeping strict types without
  `any`.
- The first config test run showed the schema `pattern` for `toolVersion`
  shadowed the semantic strict-SemVer check and produced a less precise
  locator. The pattern was removed so the semantic check owns that diagnostic.

## Self-review findings

- Unknown/legacy fields, bad types, unsupported versions, duplicate IDs and
  malformed item IDs all fail with `SCHEMA_INVALID`; a valid value is
  normalized to the documented defaults without mutating the input.
- The `pattern`/`const` schema keywords are the only structural rules; no
  `default`, coercion or property removal is used. Lexical path safety and
  reserved-state overlap remain S033/S034 gates and are intentionally not
  claimed here.

## Limitations

- No registry, item manifest, lock or command behavior is implemented.
- The checkpoint is pending independent Codex review; it is not accepted.

## RCLD-02 review-1 repair note

Independent review 1 of the committed S013-S032 candidate requested changes
under the seven RCLD02-R1 closure groups. The original implementation evidence
and commit hash above are retained as provenance; they are not acceptance. The
repaired candidate is committed as green local checkpoints and verified fresh in
`implementation/evidence/RCLD-02_QUALIFICATION.md`. This checkpoint remains
`committed_pending_review`; no acceptance counter or accepted hash changes.

## RCLD-02 review-2 repair note

Independent review 2 of the committed S013-S032 candidate requested changes
under the four RCLD02-R2 groups. The original implementation evidence and commit
hash above are retained as provenance; they are not acceptance. The repaired
candidate is committed as green local checkpoints and verified fresh in
`implementation/evidence/RCLD-02_QUALIFICATION.md`. This checkpoint remains
`committed_pending_review`; no acceptance counter or accepted hash changes.

## RCLD-02 review-3 repair note

Independent review 3 of the committed S013-S032 candidate requested changes
under the three RCLD02-R3 groups. The original implementation evidence and
commit hash above are retained as provenance; they are not acceptance. The
repaired candidate is committed as green local checkpoints and verified fresh in
`implementation/evidence/RCLD-02_QUALIFICATION.md`. This checkpoint remains
`committed_pending_review`; no acceptance counter or accepted hash changes.

## RCLD-02 review-4 repair note

Independent review 4 of the committed S013-S032 candidate requested both
RCLD02-R4 groups. The original implementation evidence and commit hash above are
retained as provenance; they are not acceptance. The complete normalized
cross-role ownership repair and the fresh cumulative qualification are recorded
in `implementation/evidence/RCLD-02_QUALIFICATION.md`. This checkpoint remains
`committed_pending_review`; no acceptance counter or accepted hash changes.
