# RCLD-04 independent qualification

Reviewer: separate Codex reviewer, not an author of the repairs. Date:
2026-10-07. Accepted code candidate:
`ce54d7d6a93f3f7dd2d1e25038390f6d95deb033`.

Disposition: **S064–S077 accepted**, subject only to committing these independent
review records and mechanically updating the ledger at a reachable evidence
anchor before S078. No further product repair is required at this gate.
Previously accepted S001–S063 remain accepted. All 203 original checkpoint
definitions were compared with `a176387` and are byte-identical.

## Original scope and cumulative review

This review assessed the original S064–S077 contract anchors and required tests
in COMMIT_SEQUENCE.md, SECURITY_AND_TRANSACTIONS.md, SYNCHRONIZATION.md,
API_CONTRACTS.md and ACCEPTANCE_CRITERIA.md, together with all outstanding
RCLD04-R2-1..5 and subsequent review findings. Source inspection covered actual
registry loading, snapshot/environment/installed resolution, init/add/sync
planners, composition and validation callers, sealed apply, lexical layout
proof, coordination, staging, replacement, durability, publication, inventory,
owned ancestry and recovery. Maintained protocol, process, lifecycle and
resulting-consumer tests were checked against their claimed causes.

| Checkpoints | Original obligations supported by reviewed source and evidence                                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S064–S065   | Frozen trusted-local state transitions and outcomes; strict internal journal/coordination identity, paths and shapes; equal lock bytes do not establish publication identity.                                             |
| S066–S067   | Exclusive writer coordination and live ownership proof without PID/age takeover; full original immutable planning/composition authority and guarded physical/environment/installed-resolution revalidation.               |
| S068–S070   | Same-filesystem staging, exact staged bytes/modes and live preimages at replacement boundaries, owned absent ancestry, guarded ignore integration, prepared journals and truthful recorded replacement progress.          |
| S071–S072   | Canonical lock published last with a durable physical rename witness; required parent-directory flush ordering; exact owned cleanup and propagated release/durability failures.                                           |
| S073–S075   | Full rollback preflight, exact restoration and published cleanup; root/mapping/phase/image/witness binding; recursive inventory; edited, corrupt, unreadable, ambiguous or unrelated evidence retained.                   |
| S076        | Real separate-process writer contention and interruption, held-owner refusal without mutation, and fresh coordinated recovery with complete-tree checks.                                                                  |
| S077        | Complete conflict-free real planner outputs pass one guarded apply boundary; altered/partial/stale/unsafe plans refuse; actual lifecycle and consumer behavior are qualified separately from low-level protocol fixtures. |

No remaining material defect was found within this original guarded-core scope.
Production CLI write-command wiring begins at S078–S091 and is not implied by
acceptance of the core API.

## Findings closed by independent causal checks

Registry-derived export relationships are immutable authenticated capabilities.
More importantly, original planner receipts bind the exact captured snapshot,
complete original operations, semantic lock and publication bytes.
Composition requires original planner authority unconditionally, including
zero-item initialization. A separate private receipt binds the entire composed
value and readset, and validation requires it before sealing. Sync revokes its
intermediate Add authority; satisfied fallback requires recorded publication
bytes. Public lookups cannot mint these receipts.

Independent real planner probes previously reproduced accepted publication
after omitting export integration/authority, source ownership/target, or an
original package manifest read. The repaired candidate rejects these as
PLAN_COMPOSITION_UNAUTHENTICATED. Stripping all planner claims before composition
rejects as COMPOSE_PLANNING_AUTHORITY_CHANGED. Authentic controls remain valid.
Maintained causal coverage includes compose-authority, semantic-authority,
transaction-authority and review17-authority integration suites.

Independent Svelte compiler/server-render probes previously reproduced missing
page children despite accepted const-shadowed and deferred-component layouts.
The repaired candidate rejects object/index/const shadows, dormant snippets and
unknown deferred component/slot bodies as PROJECTED_LAYOUT_RENDERING_MISSING.
Direct and declaration-site closure controls still apply and actually render
the marker. The parser also excludes named legacy slots and unsupported fragment
bodies from default-child proof. Maintained unit coverage preserves legitimate
aliases, invoked wrappers, closure scopes, fallback/default slots and unrelated
component siblings. These checks use valid source established before capture;
they do not mutate an already authenticated positive plan.

Authentic fixture migration exposed genuine rollback retry defects. Completed
restoration now persists the existing terminal rolled_back state before owned
target-directory deletion. A refused restore retains recorded ancestry and
journal evidence. Terminal continuation has cleanup authority only: every
current semantic image must equal its original preimage, surviving stage/backup
bytes and modes must match, and the publication witness must prove root,
transaction, plan and physical prepublication identity. It cannot restore files
or claim a publication.

Independent latest-artifact terminal probes confirmed safe successful cleanup
and refusal with retained evidence for missing/wrong witnesses, changed staged
publication bytes/mode, forged completion before restoration, a forged prepared
phase after ancestry removal, and forged rollback after actual publication.
Reviewed cleanup-result identity capabilities and postrelease ancestry removal
cannot mint unproven ownership. Maintained terminal-rollback controls cover these
cases. The final owned-ancestry flush regression proves that a post-removal flush
failure retains the terminal journal and a fresh retry returns the original tree.

Migrated hand-built positive apply fixtures now use actual captured production
initialization. They no longer substantiate former synthetic Button creation or
old-target retirement claims. Real multi-item/lifecycle/retirement/replacement
and process suites retain those operation classes. Negative hand-built projection
fixtures establish structural diagnostics only and cannot authorize effects.
S077_REPORT.md now records this distinction.

## Verification and artifact identity

Reviewer executions: extbuild doctor and routed isolated production omission,
lexical rendering and terminal recovery probes described above, each exit 0
after repairs. Probe outputs establish outcomes rather than an invented suite
count. Lexical probes use the pinned Svelte compiler/server renderer; compiled
CSS imports alone are omitted for the isolated Node renderer. Full application
build/browser evidence below is separate.

Audited author executions on the repaired source, each reported exit 0 and
checked against retained command logs:

- Engine-strict frozen installation; build, typecheck, lint, format:check;
  generated contract projection and contract validation.
- Unit 293/293; complete integration 553/553; subsequent focused owned-ancestry
  5/5, including one new post-removal flush case. This covers 554 distinct
  integration cases, not a claim that the final full suite ran 554 cases.
- Registry 38/38, CLI bootstrap 52/52, harness 37/37, components 22/22 including
  17 strict-declaration controls, contracts 137/137.
- Fixture check zero errors/warnings; fixture build and smoke/SSR 27/27,
  including six actual default/custom add/update/retirement consumers;
  Chromium browser 23/23.
- Checksum-qualified actionlint 1.7.12 on the CI workflow. Archive SHA256:
  `aba9ced2dee8d27fecca3dc7feb1a7f9a52caefa1eb46f3271ea66b6e0e6953f`.
- Unchanged read-only reference at
  `a10fbf06334f4648f5755e05a7147414e4e5fc98`: fmt/check/test pass;
  578 passed, zero failed, four ignored.

Execution used Node 24.21.0, pnpm 11.22.0, macOS arm64 and extbuild routing.
Ignored retained author logs and identity manifest are under
`implementation/evidence/logs/codex-r10/`. The reviewer checked all 239 recorded
source/config/test hashes and 76 built artifact hashes against the clean exact
committed candidate; all match. The final focused change adds a test only.
Author cumulative lanes are audited evidence, not relabeled reviewer executions.
Earlier failing attempts remain part of repair history.

## Limits and next gate

This accepts the original RCLD-04 transaction/recovery and composition scope.
It does not accept CLI integration, remaining catalog work, packed workflows,
platform release, publication, deployment or the complete MVP. S078–S203 remain
under their original definitions and dependency gates.

Windows execution, physical second-filesystem execution and remote CI were not
run. Same-device refusal is implemented and locally qualified at its supported
boundary; no physical cross-device execution is claimed. Later platform/package
acceptance remains required. AC20 retains exactly the fixture-only two upstream
Bits TS2590 exceptions with strict controls and four ignored reference tests;
none is reported passed or waived. These are recorded qualification limits,
not software work described as hardware-blocked.
