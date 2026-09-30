# S025 step report — Load assets relative to the installed package

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S025","kind":"report","commit":"287e5f5b7f7be4ac87307bd45cd153f7f635ac7b","disposition":"candidate"}
-->

Step ID and title: S025 — Load assets relative to the installed package.

Contract/requirement IDs: R08, R16, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/ARCHITECTURE.md`,
`specs/DATA_MODEL.md`, `specs/SECURITY_AND_TRANSACTIONS.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.
This commit also records the bookkeeping that moves S024 to
`committed_pending_review`.

## Scope implemented

- `src/registry/assets.ts` provides a read-only provider pinned to an explicit
  package root. Requests are restricted to `registry/` and `schema/v1/` and the
  known text asset extensions; absolute/traversal/separator-confused paths,
  missing assets, non-files, symlinked assets, escaping symlink ancestors and
  invalid UTF-8 are typed errors.
- `createInstalledAssetProvider()` resolves the running package root by walking
  up for `package.json` (no CWD use); `createSourceAssetProvider(root)` is an
  explicit test/development injection, never a hidden runtime fallback. No
  read ever falls back to the reference repository or network.
- `package.json` declares the packaged `files` (dist, schema, registry, docs,
  licenses) so the tarball carries the runtime assets.

## Files changed or added

| Path                                                                          | Change   | Purpose                              |
| ----------------------------------------------------------------------------- | -------- | ------------------------------------ |
| `src/registry/assets.ts`                                                      | new      | Package-relative asset provider.     |
| `tests/unit/assets.test.ts`                                                   | new      | S025 direct tests.                   |
| `package.json`                                                                | modified | Explicit packaged `files` inventory. |
| `implementation/COMMIT_SEQUENCE.md`, `implementation/evidence/S024_REPORT.md` | modified | Record S024 pending review.          |

## Verification

| Check                     | Command                                           | Exit | Result                                                    |
| ------------------------- | ------------------------------------------------- | ---- | --------------------------------------------------------- |
| Direct lane               | `pnpm run test:unit -- tests/unit/assets.test.ts` | 0    | 7 tests, 7 pass                                           |
| Build                     | `pnpm run build`                                  | 0    | emitted dist                                              |
| Local pack inventory      | `pnpm pack --pack-destination /tmp/suik-pack`     | 0    | 34 files                                                  |
| Packaged asset inspection | `tar -tzf …`                                      | 0    | dist/schema/registry present; no src/tests/implementation |
| Typecheck (4 configs)     | `pnpm run typecheck`                              | 0    | exit 0                                                    |
| Format / lint             | `pnpm run format:check`, `pnpm run lint`          | 0    | clean                                                     |
| Contract validation       | `pnpm run check:contracts`                        | 0    | 0/0                                                       |

## Self-review findings

- An isolated package root under the repo CWD reads only its own assets; a path
  present only in the authoring checkout is `ASSET_MISSING`.
- Symlinked assets and escaping symlink ancestors are rejected before the bytes
  are returned; bytes stay readable when only text decoding fails.

## Limitations

- Final release packaging acceptance remains in its scheduled sequence; this is
  a local eligible check only. Pending independent Codex review.

## RCLD-02 review-1 repair note

Independent review 1 of the committed S013-S032 candidate requested changes
under the seven RCLD02-R1 closure groups. The original implementation evidence
and commit hash above are retained as provenance; they are not acceptance. The
repaired candidate is committed as green local checkpoints and verified fresh in
`implementation/evidence/RCLD-02_QUALIFICATION.md`. This checkpoint remains
`committed_pending_review`; no acceptance counter or accepted hash changes.
