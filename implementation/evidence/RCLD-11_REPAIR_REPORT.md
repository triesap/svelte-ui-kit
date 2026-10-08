# RCLD-11 completion amendment and planning qualification repair

Author: Codex. Date: 2026-10-08. Repair candidates; no independent acceptance.

The owner approved the full completion-review recommendations. The governing
COMMIT_SEQUENCE.md now specifies R11-F01–R11-F06 inside the existing RCLD-11,
preserving all original checkpoint definitions, dependencies and review gates.
Supporting scope/API/safety/acceptance contracts record the source-fix fallback,
strict-green requirement, no-change refusal and full acceptance-suite CI.
Current verification, open questions, command guidance and traceability were
reconciled without claiming the planned product fixes have run or passed.

## Planning verification input repair

The first full contract regression run executed 158 tests: 22 passed and 136
failed, with zero skips. Isolated fixtures omitted real links introduced by
current operating guidance, including pre-existing AGENTS/runbook links and new
open-question evidence links. Live contract validation passed, but valid fixture
construction failed on those missing inputs. That run remains retained as
completion-amendment-contract-tests.log under the ignored logs directory.

The fixture's explicit allowlist now includes the actual linked guidance,
schema, consumer metadata and source/evidence files. No placeholder targets or
disabled link checks were introduced. Copied source files are inert link targets,
not product code executed by the fixture. Historical checkpoint authority
comments are removed before scenario construction generates its own records
and real temporary Git hashes; historical prose remains source input.

A causal regression verifies authentic guidance/schema/source bytes, preserved
historical prose without imported authority, successful read-only validation,
refusal of an imported authoring record, and read-only missing-target errors
for command guidance, traceability, schema, consumer metadata and CSP source.
Existing lifecycle, reachability, dependency and no-write controls remain.

## Actual checks

Commands ran from this repository root with Node 24.21.0 and pnpm 11.22.0.
Formatting/lint/typecheck and live contract validation passed before the fixture
repair. After that repair:

- Focused catalog/input/lifecycle contract controls passed 4/4.
- The final owning guidance/authority negative control passed 1/1, zero skips.
- Full formatting, lint, all six root typechecks and contract validation were
  rerun and passed, with zero errors or warnings from contract validation.
- The complete contract regression rerun passed 159/159, with zero failures,
  cancellations or skips and process exit 0 (683559.901125 ms).

Focused commands were:

```sh
node --test --test-name-pattern='linked operating guidance|adopted-document fixture validates clean|fixture completion hashes|isolated catalog provenance' tools/check-contracts.test.mjs
node --test --test-name-pattern='linked operating guidance' tools/check-contracts.test.mjs
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm run check:contracts
pnpm run test:contracts
git diff --check
```

Logs use the completion-amendment prefix in implementation/evidence/logs.
The final full rerun uses completion-amendment-final-contract-tests.log; failed
and focused attempts retain their original names and outcomes. All 203 original
definition slices were compared byte-for-byte with a176387 and remain unchanged.
Both reference source repositories remain clean and unchanged. No product
runtime code, selected native pins, CI workflow, publication or deployment was
changed by this planning maintenance.

## R11-F01 — Strict native diagnosis

The repository-owned `tools/strict-native-probe.mjs` constructs disposable
projects with explicit strict peer/engine installs. A three-line public-root
Button/Calendar import reproduces exactly the two native TS2590 diagnostics;
a valid no-import control passes and an authored invalid assignment adds the
expected TS2322. It also runs the actual full consumer checker with
`skipLibCheck: false`, separately records raw process outcomes and cleans only
its owned project. Installation success or diagnostic qualification never
counts as raw strict acceptance.

Three bounded profiles executed successfully as diagnostic qualifications:

| Profile       | Actual native/compiler/Svelte/checker                  | Minimal raw tsc / full raw consumer                 |
| ------------- | ------------------------------------------------------ | --------------------------------------------------- |
| current       | Bits 2.19.3 / TS 6.0.3 / Svelte 5.57.1 / checker 4.7.6 | exit 2 / exit 1; two TS2590, zero consumer warnings |
| producer-full | Bits 2.19.5 / TS 5.9.3 / Svelte 5.46.4 / checker 4.3.1 | exit 2 / exit 1; same failures                      |
| peer-floor    | Bits 2.19.5 / TS 5.9.3 / Svelte 5.33.0 / checker 4.3.1 | exit 2 / exit 1; same failures                      |

The producer profile includes Kit 2.49.5, plugin 6.2.0, Vite 7.1.5,
package 2.5.0, svelte2tsx 0.7.34, date 3.8.2, runed 0.35.1 and toolbelt
0.10.6, matching the recorded producer roles. The peer-floor trial is supported
by observed package peer ranges; no unsupported package combination is adopted.
Actual versions, native exports/peers/engines, native declaration SHA-256
inventories, lockfiles/integrities and compiler traces are retained under
`implementation/evidence/logs/r11-f01`. Both current and producer-full final
records include actual native transitive versions and the checker-shim digest.
All three owned projects were removed.

Follow-up emitter investigation found that pnpm 11 ignored the first producer
and peer-floor probes' `package.json` override field. Their complete records
are retained as `producer-full-ignored-overrides.json` and
`peer-floor-ignored-overrides.json`; those runs reproduce failures but do not
authenticate the promised transitive baseline. The helper now puts overrides
in `pnpm-workspace.yaml`, checks every actual native transitive pin and resolves
the declaration emitter from the package tool's own context. Corrected reruns
passed for both profiles, authenticating emitter 0.7.34 and all six native
transitive pins; the full strict checks still fail with the same two errors
and zero warnings. The corrected final raw records replace no historical
attempt; both owned projects were removed.
This correction changes no selected product dependency or acceptance status.

Actual `tsc --generateTrace` records identify `checkCrossProductUnion_DepthLimit`
on property-key unions: 444 × 449 = 199356 for Button and 458 × 458 = 209764
for Calendar on current/producer-full; peer-floor yields 439 × 442 = 194038
and 453 × 453 = 205209. Trace type records contain DOM prop names and symbols,
not guessed CSS-value products. The installed Svelte `Component` binding
constraint is `Bindings extends keyof Props | ''`; the authentic Button and
Calendar declaration instantiations and source union branches trigger that
constraint. The inspected compiler refuses products at 100000. Changing heap
or treating the existing exception as green does not resolve this cause.

The initial minimal harness used NodeNext resolution without the checker's
ambient shims and reported different transitive declaration errors. That failed
attempt is retained separately as `current-initial-harness-failure.json` and
its matching log. Corrected probes use actual bundler resolution and the
installed checker shim, without editing installed declarations. The native
source at revision `fd10616a873a8e6e3652e31dcc88c5c2f155a9e2` confirms the
source unions, bindable props and real emitter configuration. No reference,
installed package, manifest or selected production pin was changed.

Commands executed:

```sh
node tools/strict-native-probe.mjs current implementation/evidence/logs/r11-f01
node tools/strict-native-probe.mjs producer-full implementation/evidence/logs/r11-f01
node tools/strict-native-probe.mjs peer-floor implementation/evidence/logs/r11-f01
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm run check:contracts
git diff --check
```

All three diagnostic qualifications and format/lint/six typechecks/contracts
passed; contract validation reported zero errors/warnings. The raw failing
compiler/checker results above remain failures, not accepted strict results.

The next candidate should avoid the demonstrated binding-key expansion through
an authentic source/declaration-generation correction while preserving the
complete discriminated props and binding contracts. No source fix is yet
qualified. R11-F02 owns that correction, reproducible delivery and actual
native/consumer/runtime acceptance. S201 remains blocked and no checkpoint
acceptance changes.

## Remaining implementation and acceptance

Planning input maintenance and R11-F01 diagnosis are verified candidates;
neither repairs native declarations nor grants independent acceptance.
Original progress remains 200 implemented candidates and 193 independently
accepted checkpoints. R11-F02 strict resolution, R11-F03 no-change refusal,
R11-F04 CI, R11-F05 final
guidance/boundary qualification, R11-F06/S201 full cumulative release checks,
S202 extension reconciliation, S203 delivery and separate final acceptance of
S194–S203 remain required. The two native TS2590 errors are still the actual
strict blocker. No S201 implementation commit or independent acceptance is
manufactured by this report. Continue to record actual repair outcomes here;
the governing plan and existing tracker retain execution authority.
