# RCLD-03 review-4 composition repair — implementation evidence

Current disposition: Pi-authored implementation evidence under the owner-authorized
`pfc through RCLD-03` batch. Codex alone accepts; this document is not acceptance
and does not close S033–S063.

## Repair commits

- `4a6952a` — compose one validated planning entry (RCLD03-R4-1/2/3 core).
- `ea5dcf3` — root-barrel cycle qualification, real planned-consumer and
  installed planner/parser lanes, review-4 progress and S063 prose reconciliation.
- `12bbd81` — manifest-authoritative compound-barrel decision.
- `5f57eb4` — lock-owned missing integration conflicts, complete-observation
  purity/conflict controls and metadata-only discrimination.
- `27aed65` — supplied lock lineage reconciled with the observed lock bytes.

## What the repair implements (Pi implementation, pending review)

- **One validated entry (R4-1).** Add/sync validate every reason-about target
  before any executable result: an unobserved path, a nonregular/unreadable
  target or invalid UTF-8 is a conflict with a logical cause rather than an
  assumed empty file. Observed `kit.json`/`kit.lock.json` bytes are parsed;
  malformed metadata conflicts and an observed lock with no supplied lineage
  conflicts. Strict BOM-preserving decoding is shared with initialization.
- **Snapshot registry identity.** The projected lock uses
  `registry.root.registryVersion`/`contentHash`; a separately supplied scalar
  cannot change the identity.
- **Minimal initialization effects (R4-1/S058).** A fresh add creates the
  foundation `kit.css`, the empty `themes.css`/`app.css`, imports them in the
  layout and records `layout`/`stylesheet`/`exports` integration baselines.
- **Ownership before patching (R4-2).** An unowned managed export region or CSS
  block conflicts; markers confer no ownership. The foundation `tokens` layer is
  owned by the stylesheet integration and is exempt from item-block ownership.
- **Effective export cohorts (R4-2).** An owner's export member joins its
  compatibility unit, and a declaration change is proven from the observed
  region rather than item-version inequality, so a customized source with a
  renamed public export blocks the whole batch.
- **Truthful projection and retirement (R4-3).** `buildLockProjection` receives
  integration records, so init→add retains them. Clean deletion is an explicit
  `retire` operation carried in the plan and the envelope; it is never a
  zero-byte `update`.
- **Integration ownership.** A lock-owned layout/stylesheet/exports integration
  whose target has gone missing is a conflict, never a silent recreation.
- **Cycle qualification (R4-2).** Incoming generated sources are scanned with the
  existing AST authority; a root-barrel import is a conflict.
- **Compound decision (R4-2).** `shouldGenerateCompoundBarrel` now uses
  `isCompoundComponent` and declared exports, not export counts/targets.
- **Supplied/observed reconciliation.** A supplied lock that disagrees with the
  observed `kit.lock.json` bytes is a conflict; observed absence stays
  authoritative over an in-memory lineage.

## New verification lanes

- `tests/integration/plan-composition.test.ts` — directory/incomplete/malformed
  conflicts, BOM preservation, snapshot identity, fresh prerequisites and
  integrations, init→add retention, unowned exports, export cohorts, explicit
  retirement plus satisfied replay, and root-barrel cycle qualification.
- `tests/integration/planned-consumer.test.ts` — a consumer built from exactly
  the composed add plan over a real validated registry snapshot checks/builds.
- `tests/integration/installed-package.test.ts` (R5) — the emitted planner and
  TypeScript/Svelte parser/planner paths import and run outside the checkout.

## Verified results at `27aed65` (Node 24.21.0 / pnpm 11.22.0)

| Lane                                                                        | Result                                 |
| --------------------------------------------------------------------------- | -------------------------------------- |
| `pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict` | exit 0                                 |
| `format:check`, `lint`, `typecheck`                                         | exit 0                                 |
| `test:unit`                                                                 | 265 pass / 0 fail                      |
| `test:integration`                                                          | 217 pass / 0 fail                      |
| `test:registry`                                                             | 38 pass / 0 fail                       |
| `test:harness`                                                              | 37 pass / 0 fail                       |
| `test:cli-bootstrap`                                                        | 52 pass / 0 fail                       |
| `test:components`                                                           | 22 pass / 0 fail                       |
| `test:contracts` / `check:contracts`                                        | pass / 0 errors, 0 warnings            |
| `fixture:check`                                                             | svelte-check 0 errors / 0 warnings     |
| `test:fixture`                                                              | exit 0                                 |
| `test:browser`                                                              | 23 passed (chromium, fault + teardown) |
| checksum-verified `actionlint 1.7.12`                                       | exit 0                                 |
| clean `leptos_ui_kit` reference at `a10fbf0`                                | fmt/check/test 0; 578 / 0 / 4 ignored  |

No lane was skipped. The four reference tests are explicitly ignored, not
zero-skips across every lane.

## Remaining review-4 work (not claimed complete)

- Full S033–S063 report/`COMPATIBILITY` reconciliation for intermediate failures,
  reruns and raw exits; only `S063_REPORT.md`, `VERIFICATION.md` and the ledger
  progress note are updated here.
- A fully cumulative S063 qualification on the final candidate must be rerun by
  the reviewer; this document does not substitute for it.
- S064 remains gated by independent S063 acceptance.
- The fixture-only Bits declaration exception remains release AC20 debt.
