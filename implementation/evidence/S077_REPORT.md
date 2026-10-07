# S077 step report — Compose the guarded apply use case

The separate reviewer independently accepted the original S077 criteria on
`ce54d7d6a93f3f7dd2d1e25038390f6d95deb033`; review evidence is committed at
`fd1d0938d9ad188c5646c153b76fa2989438c727`. Original implementation `9f18e2e9721f1e9695ecc17a044c6e3526dd568d` remains provenance.
See `S077_REVIEW.md` and `RCLD-04_QUALIFICATION.md`. Historical author results
below are supplemented by the current repair and qualification records.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S077","kind":"report","commit":"fd1d0938d9ad188c5646c153b76fa2989438c727","disposition":"implemented"}
-->

Step ID and title: S077 — Compose the guarded apply use case.

Contract/requirement IDs: R13, R14, R15, R16, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see
`specs/SECURITY_AND_TRANSACTIONS.md`, `specs/SYNCHRONIZATION.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `src/codegen/apply.ts` composes the single guarded apply boundary: recovery
  check (`recoverTransactions`; refuse on any ambiguity), exclusive writer
  coordination, preimage revalidation, journaled same-filesystem staging,
  ordered replacement with recorded progress, canonical lock-last publication
  and safe cleanup. A `ValidatedApplyPlan` brand is produced only by
  `validateApplyPlan`, which rejects partial objects, unsafe/out-of-root/
  duplicate targets, inconsistent preimages and an empty lock. Apply consumes
  plan data only and never plans.
- Outcomes are `applied`, `no_change` (satisfied plan, no transaction),
  `committed_needs_cleanup` and `refused`; a failed replacement is rolled back
  to its exact preimages and the writer lock is always released in `finally`.
- The original hand-assembled positive apply fixture has been superseded by
  authentic captured production initialization. `tests/integration/apply.test.ts`
  now proves that guarded init batch, stale/unsafe refusal, satisfied replay,
  metadata-only publication, mapped roots and exact rollback. Actual multi-item
  add/update/retirement/conflict and resulting-consumer qualification are proved
  separately by the composed lifecycle suites. Initialization alone does not
  establish those dispositions. See `RCLD04_CODEX_REPAIR.md` for current repairs.

## Historical cumulative qualification (original S077 candidate)

Repository-owned commands; raw logs retained at
`implementation/evidence/logs/rcl04-s077-20261002/`.

- `pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict`
  — 0.
- `pnpm run build`, `format:check`, `lint`, `typecheck` — 0, 0, 0, 0.
- `pnpm run test:unit` — 276/276; `test:integration` — 340/340;
  `test:registry` — 38/38; `test:cli-bootstrap` — 52/52; `test:harness` —
  37/37; `test:components` — 22/22 (17 strict-declaration controls).
- `pnpm run fixture:check` — 0 errors/0 warnings; `pnpm run test:fixture` —
  23/23; `pnpm run test:browser` — 23/23.
- `node tools/check-contracts.mjs --generate` then `pnpm run check:contracts` —
  0 errors/0 warnings; `pnpm run test:contracts` — 137/137.
- Checksum-qualified workflow validation: `actionlint 1.7.12` archive SHA-256
  `aba9ced2dee8d27fecca3dc7feb1a7f9a52caefa1eb46f3271ea66b6e0e6953f` matched and
  `actionlint .github/workflows/ci.yml` exited 0.
- Applicable read-only reference guard at clean
  `a10fbf06334f4648f5755e05a7147414e4e5fc98`: `cargo fmt --all -- --check` 0,
  `cargo check --workspace --all-targets` 0, `cargo test --workspace --all-targets`
  0 (578 passed, 0 failed, 4 ignored). No Rust code was added to this
  repository.

Release AC20's fixture-only upstream Bits TS2590 exception remains open debt; no
new suppression was added.

## Files touched

- `src/codegen/apply.ts` — the composed guarded apply use case.
- `tests/integration/apply.test.ts` — new focused suite.
- `implementation/COMMIT_SEQUENCE.md` — finalizes the S076 pending ledger row
  and records this checkpoint's implementation hash with the successor.

## Limitations

- Not run/claimed: Windows and non-local filesystems (documented in S076).
- Production CLI command wiring remains RCLD-05; this checkpoint supplies and
  qualifies the apply boundary that those commands will consume.
- S078 requires independent Codex acceptance of S077 first.
