# S011 step report — Qualify the pinned primitive integration boundary

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S011","kind":"report","commit":"64a1acb48ad552b0c6097b34b7c58f0cdbcf0c6f","disposition":"candidate"}
-->

Step ID and title: S011 — Qualify the pinned primitive integration boundary.

Contract/requirement IDs: R03, R12, R20, R21, R29, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/ACCEPTANCE_CRITERIA.md`,
`specs/API_CONTRACTS.md`, `specs/ARCHITECTURE.md`,
`specs/COMPONENT_CATALOG.md`, `specs/DATA_MODEL.md`).

Author: Pi, provider `ollama`, model `deepseek-v4.1-flash:cloud`. Runtime:
Node `24.21.0` / `pnpm 11.22.0`.

Under the owner-authorized batch this report is a candidate; the S011
implementation commit makes it `committed_pending_review` pending independent
Codex review.

## Dispatch mapping

| #   | Dispatch decision                 | Implementation                                                                                                                                                             | Evidence                                                                       |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 1   | Approved fixture runtime pins     | Fixture `dependencies` add `bits-ui 2.19.3` and `@internationalized/date 3.12.4`; all other pins preserved.                                                                | `tests/fixtures/consumer/package.json`, `pnpm-lock.yaml`                       |
| 2   | Bits `Switch.Root`/`Switch.Thumb` | Fixture-only component binds `checked`/`ref` and uses a real `child` snippet spreading merged props onto a delegated native `<button>`; hidden input renders as a sibling. | `tests/fixtures/consumer/src/lib/compatibility/SwitchFixture.svelte`, SSR HTML |
| 3   | Dedicated route                   | `tests/fixtures/consumer/src/routes/compatibility/+page.svelte` with a hydration marker.                                                                                   | Fixture SSR `/compatibility` test                                              |
| 4   | `test:components` typed suite     | `tsconfig.components.json`, `tests/components/compatibility.test.ts`, root `test:components` using `--suite components`.                                                   | `package.json`, `tools/run-unit-tests.mjs`, components suite 4/4               |
| 5   | Positive and negative type proofs | Maintained component type-checks; disposable copies prove incompatible `checked`/`ref`/`child` examples fail with intended diagnostics and restore to green.               | `tests/components/compatibility.test.ts`                                       |
| 6   | SSR + browser behaviour           | Added `/compatibility` SSR assertion and five browser tests (semantics, pointer, keyboard, programmatic, ref/focus, child forwarding).                                     | `tests/smoke/consumer-fixture.test.mjs`, `tests/browser/harness.spec.ts`       |
| 7   | Compatibility/CI evidence         | `COMPATIBILITY.md` S011 addendum; CI workflow and COMMANDS add the components lane.                                                                                        | Those files                                                                    |

## Upstream constraints requiring Codex review

The pinned `bits-ui 2.19.3` declarations impose two consumer-side requirements.
Both are documented in `COMPATIBILITY.md` S011 and here:

1. **Undeclared `csstype` type dependency.** `bits-ui/dist/shared/index.d.ts`
   and `svelte-toolbelt/dist/types.d.ts` import `csstype`, but the packages
   declare it only under `devDependencies`, so a strict pnpm consumer cannot
   resolve it. The fixture adds the exact direct dev pin `csstype 3.1.3`.
2. **TypeScript 6.0.3 union-complexity limit.** `svelte-check` raises TS2590
   (`Expression produces a union type that is too complex to represent`) in the
   `bits-ui` barrel declarations for `Button`/`Calendar`; `bits-ui` exposes only
   its root entrypoint, so the barrel cannot be avoided. The fixture sets
   `skipLibCheck: true` to tolerate declaration-file complexity in the pinned
   dependency. Authored fixture source remains under `strict: true`.

Neither change alters an existing pin, and neither weakens checking of authored
source. They are reported so Codex can confirm the remedy or choose another.

## Files changed or added

| Path                                                                                                         | Change   | Purpose                                                             |
| ------------------------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------- |
| `tests/fixtures/consumer/package.json`                                                                       | modified | Adds `bits-ui`, `@internationalized/date`, `csstype` pins.          |
| `tests/fixtures/consumer/tsconfig.json`                                                                      | modified | Adds `skipLibCheck` for the upstream declaration limit.             |
| `tests/fixtures/consumer/src/lib/compatibility/SwitchFixture.svelte`                                         | new      | Fixture-only Bits switch compatibility component.                   |
| `tests/fixtures/consumer/src/routes/compatibility/+page.svelte`                                              | new      | Dedicated route with a hydration marker.                            |
| `tsconfig.components.json`                                                                                   | new      | Components suite compiler configuration.                            |
| `tests/helpers/fixture.ts`                                                                                   | new      | Owned fixture copy + script runner (real `node_modules` link tree). |
| `tests/components/compatibility.test.ts`                                                                     | new      | Positive + negative typed component proofs.                         |
| `tests/smoke/consumer-fixture.test.mjs`                                                                      | modified | Copy-helper fix, `/compatibility` SSR test.                         |
| `tests/browser/harness.spec.ts`                                                                              | modified | Five Bits switch browser tests.                                     |
| `package.json`                                                                                               | modified | `test:components`, `typecheck` includes the components config.      |
| `.github/workflows/ci.yml`, `implementation/evidence/COMMANDS.md`                                            | modified | Components lane.                                                    |
| `README.md`, `CONTRIBUTING.md`, `implementation/VERIFICATION.md`, `implementation/evidence/COMPATIBILITY.md` | modified | Qualification docs.                                                 |

## Copy-helper correction

Adding the Bits dependency graph changed pnpm's `.bin` shims so that a copied
`node_modules` **directory symlink** broke resolution: the shim resolves its
target relative to the invoked path, so a copy's `.bin/svelte-kit` looked
outside the repository. Both the S007 smoke copy helper and the components
helper now build a real `node_modules` directory containing per-package and
per-bin symlinks into the maintained fixture, which keeps package resolution and
the shims' real path correct. This also repaired the S007 disposable-copy
controls that the dependency change would otherwise have broken.

## Verification

| Step                | Command                                                  | Exit | Result                                    |
| ------------------- | -------------------------------------------------------- | ---- | ----------------------------------------- |
| Typecheck           | `pnpm run typecheck`                                     | 0    | includes `tsconfig.components.json`       |
| Fixture check       | `pnpm run fixture:check`                                 | 0    | 0 errors, 0 warnings                      |
| Components          | `pnpm run test:components`                               | 0    | 1 file; 4 tests, 4 pass                   |
| Consumer SSR        | `pnpm run test:fixture`                                  | 0    | 17 tests, 17 pass                         |
| Browser             | `pnpm run test:browser -- tests/browser/harness.spec.ts` | 0    | 11 passed                                 |
| Lint                | `pnpm run lint`                                          | 0    | no findings                               |
| Format check        | `pnpm run format:check`                                  | 0    | All matched files use Prettier code style |
| Contract validation | `pnpm run check:contracts`                               | 0    | 0 error(s), 0 warning(s)                  |
| Contract tests      | `pnpm run test:contracts`                                | 0    | 101 tests, 101 pass                       |

Earlier failed attempts in this slice: the fixture check initially reported 822
errors (undeclared `csstype`; then 2 TS2590 errors) — resolved as documented
above; the copied-fixture `pnpm run check` initially failed to resolve the pnpm
bin shims — resolved by the real `node_modules` link tree. No assertion was
weakened.

## Limitations

- No public kit wrapper, registry item, generator output or tarball acceptance
  is produced.
- Only bundled Chromium on macOS/Node 24.21.0 was exercised.
- `skipLibCheck` tolerates an upstream declaration-complexity limit; it is not
  applied to authored fixture source.
- Pending review is not independent acceptance.

## Self-review findings

- The fixture component uses real Bits types, `bind:checked`, `bind:ref` and the
  real `child` snippet; no `any` cast or dropped prop is used.
- The SSR HTML shows the delegated `<button role="switch">` with merged props
  and the hidden input as a sibling, so no nested button is created.
- The components negatives run only in disposable copies and restore to green;
  the maintained fixture is never left mutated.
- CI and the command map now include the components lane; the workflow remains
  unpushed and unexecuted remotely.

## Commit and next action

Commit message: `test: qualify the pinned svelte and bits boundary`. The commit
hash is recorded in this report's evidence after the commit. Next checkpoint:
S012, authorized to proceed after the S011 green commit. Nothing was pushed or
published and S013 was not started.

## RCLD-01 repair addendum (2026-09-30)

Repair commit: `c9108c459d124e231430a382b21f198ed17eb5ae` (not the original
pending hash above). The takeover dispatch's primitive and dependency findings
are closed:

- `SwitchFixture.svelte` now renders the actual pinned `Switch.Thumb` instead of
  an ordinary span; the merged props, checked/ref bindings and child snippet are
  unchanged.
- `tests/helpers/strict-audit.ts` runs the real `skipLibCheck: false` checker in
  an owned copy and qualifies exactly the two pinned Bits 2.19.3 union-complexity
  diagnostics by package/version, path, location, identity and count.
- `tests/components/strict-declaration.test.ts` proves the baseline and that
  authored `.svelte`, `.ts` and `.d.ts` errors plus an additional disposable
  dependency error fail the audit, with restoration to the known baseline.

The strict audit is a qualified upstream exception, not a raw strict-check pass.
Raw output: exit 1, two errors, zero warnings. Resolving it remains an open
release AC20 obligation. Verified: components 7/7, fixture 23/23, browser 11/11,
format/lint/typecheck green.
