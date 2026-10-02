# RCLD-03 independent qualification

Reviewer: Codex. Date: 2026-10-02. Tested clean candidate:
`6d39fcf5916f60bd5461f11541418fa10d7b5b1a`. Product repair `b122039`, causal
assertion strengthening `5ef055d`, malformed-region control `2fa0cd3`;
other commits in the six-commit series update evidence only.

Disposition: **S033–S063 accepted by Codex**, subject only to committing these
review files and mechanically recording the reachable combined evidence anchor
before S064. This is not another product repair gate. The governing dispatch
specifies the atomic transition; until then, the ledger retains the original
31 pending implementation hashes. All original checkpoint definitions remain
unchanged. S001–S032 acceptance is preserved.

## Findings closed

- RCLD03-R8-1: captured bounded discovery and detected layout now determine the
  effective configuration in init/add/sync, including retirement and final lock
  projection. Explicit valid mappings resolve the documented dynamic-config
  fallback; unsafe/ambiguous/malformed discovery and incomplete effective target
  snapshots fail without a default installation or live gap reads. New mapped
  consumers check/build/render through their active layout. Independent compiled
  planner probes verify custom UI/styles/layout installation, init/add replay,
  retirement and satisfied sync replay using real validated registry assets.
- RCLD03-R8-2: init now refuses missing tracked registry and foundation blocks;
  present empty bodies are distinct from absent blocks. Malformed regions fail
  causally. Customized/detached tokens preserve application bytes and truthful
  ownership. The original missing-block probe now yields INIT_OWNERSHIP_CONFLICT.
- RCLD03-R8-3: shared operation application performs actual retirement; lifecycle
  and tree tests assert intended causes. Complete-tree checks and denied-write/
  child-process controls support zero-write planning. Fresh real planned simple,
  compound and mapped consumers plus emitted planning pass; the negative SSR
  control still builds/returns HTTP 200 but correctly lacks the page marker.
- Earlier validated project/manager, deep snapshot immutability, captured metadata,
  cohort, token transition, baseline, retirement and integration repairs remain
  valid. Independent original regression probes pass. No remaining blocking
  S033–S063 defect was found in source, composed callers or qualification.

## Independent verification

Host: Darwin 25.5.0 arm64; Node 24.21.0, pnpm 11.22.0. Repository-owned commands
run successfully on the tested candidate: build, typecheck (all five configs),
format:check, lint, test:unit 265/265, test:integration 295/295, test:registry
38/38, test:cli-bootstrap 52/52, test:harness 37/37, test:components 22/22,
fixture:check zero errors/warnings, test:fixture 23/23, test:browser 23/23,
check:contracts zero errors/warnings and test:contracts 127/127. No skipped
cases in these lanes. Components include 17 strict-declaration controls and the
existing narrowly qualified two upstream TS2590 diagnostics. Integration uses
actual generated app check/build/SSR and a source-independent emitted planner.
Independent probes cover the previous failing mapping/ownership/immutability/
rendering cases plus a complete custom-mapping lifecycle. No product code,
product tests or tooling was changed by the reviewer.

Author evidence was audited against native commands/results and the retained
`implementation/evidence/logs/r8-20261002/` files and underlying exits. Frozen
strict install, checksum-verified actionlint 1.7.12 with shellcheck 0.11.0,
and the clean reference guard at `a10fbf06334f4648f5755e05a7147414e4e5fc98`
pass. Reference fmt/check/test: 578 passed, zero failed, four ignored. These are
audited author results, not fresh reviewer executions. The four ignored tests
are named in RCLD03_R8_REPAIR.md and are not claimed as passed.

Evidence precision: most author cumulative lanes ran at `5ef055d`; integration
was rerun at the final malformed-region test candidate, with format/lint and
contract checks after the documentation update. Reusing unaffected lane results
is reasonable, but the claim that all 21 lanes freshly ran at `2fa0cd3` is not
literal. Fresh independent qualification above removes that ambiguity. Native
history retains repaired TS2339 type failures, init/discovery/lifecycle assertion
failures, formatting/lint failures and the malformed-region test's initial
ENOENT setup mistake; final success does not erase those attempts.

## Scope and limits

This accepts read-only planning and its model/integration boundary. The CLI
still exposes the previously accepted bootstrap behavior; production command
wiring is RCLD-05, not an accepted RCLD-03 feature. No transaction, catalog,
cross-platform release or packed full-workflow acceptance is implied. Release
AC20's fixture-only Bits declaration exception remains open debt. S064–S203
are 140 unfinished checkpoints across eight sequences after the mechanical
acceptance transition. No current owner/external/hardware blocker exists.
