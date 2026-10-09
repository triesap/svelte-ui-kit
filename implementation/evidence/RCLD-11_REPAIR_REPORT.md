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

At the diagnosis checkpoint no source fix was qualified. R11-F02 owns that
correction, reproducible delivery and actual native/consumer/runtime acceptance.
S201 remains blocked and no checkpoint acceptance changes.

## R11-F02 — Authentic producer qualification candidate

The portable [producer inputs](../../tools/native-dependency/README.md) and
`tools/build-native-dependency.mjs` now build the actual emitter from pinned
language-tools source, apply one source-shim correction in an owned copy, and
run the actual Bits package build. No native runtime source, reference checkout,
installed declaration or package store is patched. The correction retains the
native function signature, exact prop types, exports, optional legacy methods,
custom element and `z_$$bindings` metadata while avoiding the demonstrated eager
binding-key constraint expansion. It adds no constructor signature.

The final `node --test tools/build-native-dependency.test.mjs` run passed 2/2,
with zero failures/cancellations/skips, process exit 0 and duration 87295.924
ms. It performed two fresh frozen builds from the pinned public source revisions
and produced byte-identical `bits-ui-2.19.5-svelte-ui-kit.1.tgz` archives, SHA-256
`54ad1f636d7e72269d05387f562567095816e57f15a04ede19369f87866886ee`.
It also built an unpatched causal control through the same actual producer.
The control reproduces both native TS2590 errors and the raw full checker exit
1, with two errors and zero warnings. The corrected public-root import passes.

The corrected and control distributions contain the same 694 runtime and
non-component declaration files byte-for-byte. Native prop declaration unions
are unchanged. Representative mutual Button/Calendar prop assignability and
full Dialog/Svelte component assignability pass. Ten authored invalid type
controls each produce the expected application-file error: incompatible
discriminants, refs, event handlers, snippets, callbacks, bindable keys and a
constructor. Actual Svelte ref/state bindings compile, while attempted
`bind:disabled` on Button and Calendar each produces precisely one non-bindable
error and zero warnings. The corrected full raw consumer check reports zero
errors/warnings, raw tsc exits 0, and the production consumer build exits 0.
These checks complement, and do not claim, exhaustive type equivalence.

The archive preserves native package identity, public exports, exact runtime
pins, upstream peer ranges and notices. Producer-only scripts/local emitter
requirements are absent from its manifest. Provenance records both upstream
source revisions, source archive hashes, the truthful emitter source-manifest
version/tag, patch/recipe/actual frozen-lock/emitter archive digests, toolchain
and the actual distribution's file-digest inventory. The inventory follows the
real package-manager file selection, including upstream test/spec exclusions.
Existing-output and symlink/dangling-ancestry refusal controls preserve both
trees. All owned producer and consumer trees were removed.

Earlier experiments remain under ignored logs. A generic-source experiment
passed strict checking but added a constructor signature and was rejected.
Homomorphic/intersection trials still failed. Initial emitter transport used
ignored overrides and did not activate the correction; a replacement-string
trial lost one `$` from binding metadata and was rejected. Initial portable
builder trials refused an incorrect global pnpm version and invalid patch
context. Expanded qualification first used an incorrect expected diagnostic
message, then identified that a staging inventory included files excluded from
the real pack; both failed runs remain recorded. The final builder inventories
the actual pack, and the final regression authenticates every packed inventory
entry. Staged diff checking then identified a trailing space on the patch's
blank context line. Removing that space preserves the applied source bytes but
changes the patch/provenance digest; the complete producer regression was
rerun against the final bytes. No failing attempt is relabeled successful.

The final producer test log is
`implementation/evidence/logs/r11-f02-producer-qualification-final-green.log`;
its detailed build/consumer/type outcomes use the `93580-1791497851251` prefix
under `implementation/evidence/logs/native-producer`. Formatting, lint, all six
root typechecks, live contract validation and diff checks accompany this slice.

This is a green producer qualification slice inside active R11-F02. It does
not complete R11-F02, change the kit's selected native dependency, remove the
maintained strict exception, grant S201 completion or independently accept a
repair. Authentic bundled delivery, captured local-file dependency evidence,
strict-audit conversion and affected runtime/package/browser qualification
remain required before adoption.

## R11-F02 — Authenticated local transport and preparation

The native provenance artifact now has an explicit first supported v1 schema.
Unknown versions/fields and missing identity are refused without mutation.
Command/configuration/lock formats remain v1. The compiled CLI carries the
qualified native archive and provenance digests as package-relative metadata;
only those exact application-owned archive bytes can normalize a local-file
Bits declaration for compatibility inspection. Other file/git/link operands
remain invalid. A same-version SemVer-only declaration or fabricated installed
manifest cannot grant readiness. Actual installed provenance and every packed
file are authenticated, including refusal of missing/extra entries, internal
links and unrecorded empty directories.

Invocation capture freezes native observations and adds archive digest/mode and
ancestry to existing read authority. Guarded installed revalidation independently
re-proves distribution bytes and the live declared archive before writes. No new
serialized plan field, installation or package-store repair is introduced.
Dependency instructions use the existing manual field for explicit extraction,
digest verification and manager installation, with a fresh application-owned
archive and retention after the CLI host disappears. Ordinary dependencies keep
their existing manager commands; no nonexistent native registry release is
suggested. The POSIX extraction procedure refuses linked destinations.

The developer-only preparation tool generates the real frozen producer or
reuses only an authenticated cache, refuses corrupt/linked/extra state and
copies authenticated bytes into declared compiler staging or an owned fixture.
Actual generated archives remain uncommitted. Its delivery regression compiles
an owned authoring copy through the real CLI compiler, packs that CLI, extracts
the actual native member, removes both author and CLI archive, then proves a
real offline application install and frozen offline reinstall pass raw strict
public-root checking. It uses explicit csstype/Node/checker tooling and the
checker's actual official Svelte shim. The initial minimal fixture omitted those
inputs and failed; that run remains recorded without an acceptance claim.

Actual checks for this slice:

- The owning seven integration files pass 64/64, zero skips/cancellations. This
  final run uses the repository typed runner in an owned isolated copy to avoid
  overlapping the already-running full integration compiler/output writer.
- Native preparation/delivery regressions pass 2/2, zero skips, exit 0
  (92678.533125 ms). The delivery test proves real tarball transport and raw
  strict success after removal; full generated-app runtime acceptance is later.
- The full unit suite passed 298/298, zero skips. All six root typechecks, lint,
  formatting and live contract validation passed; the complete contract
  regression passed 159/159, zero skips (921991.794292 ms).
- Executable bootstrap smoke passed 44/44 with zero skips; its causal write
  and hard-coded-version mutation controls remain active.
- The full integration suite started before final guard tightening remains a
  supplementary in-progress check. Its outcome is not claimed as green here.

Logs are `r11-f02-local-file-owning-final.log`,
`r11-f02-preparation-delivery-final.log`, `r11-f02-local-file-unit.log` and
`r11-f02-local-file-contract-tests.log` under the ignored qualification log
root; failed attempts retain distinct names. Neither selected manifests/pins
nor the maintained fixture's strict exception change in this slice. F02 remains
active for actual build integration, baseline adoption, strict-audit conversion
and affected full component/registry/packed runtime/SSR/hydration/browser lanes.
No repair or original checkpoint is independently accepted by these author runs.

The supplementary full integration execution subsequently completed 844/844,
zero failures/cancellations/skips, exit 0. It used the previous selected Bits
baseline and started before final guard tightening; it does not qualify the
new baseline or final cumulative S201.

## R11-F02 — Initial .1 adoption candidate, replaced before commit

The initial candidate's root and maintained-consumer manifests explicitly installed the authenticated
`2.19.5-svelte-ui-kit.1` archive from their own ignored preparation directories.
The frozen workspace lock records the actual native artifact and exact runtime
pins. Every registry compatibility record uses the new native identity, item
patch versions advance from their own prior values, and the registry advances
to `0.1.1` with recomputed content hash
`866ecd92bc35a94ae0411b7326c589b94ba59985e63ce0f234e3fd08d7a2ea2a`.
Generated source/style bytes and immutable design-source hashes are preserved.

The build authenticates preparation, compiles the real CLI and bundles the
qualified native archive. A fresh source copy without dependency/preparation
caches completed direct preparation, frozen strict engine/peer installation,
CLI build and raw strict fixture checking without manifest/lock changes.
The maintained fixture now has `skipLibCheck: false`. The strict classifier
requires raw exit 0 with zero errors/warnings; it preserves machine-parser,
tool, workspace, six actual-version and authored/additional-dependency controls.
Same-version changed native provenance or app archive cannot certify a
synthetic zero-diagnostic result. The temporary exception is removed rather
than enlarged or silently reclassified.

Actual packed tests caught a production omission: `info` and `doctor` dropped
the captured native-file observation. Both now carry that observation into
dependency inspection. Manual dependency guidance excludes the unpublished
native operand from ordinary registry-install advice, including unknown-manager
paths. Package metadata tests authenticate the actual bundled member and
compiled identity instead of treating the intentional file operand as SemVer.
Packed consumer setup extracts from the actual CLI tarball, verifies its digest,
copies to the app's vendor directory and explicitly installs that retained file.
It never substitutes an authoring cache for consumer delivery.

Initial full component and unit executions exposed obsolete identity literals
and the empty-registry fixture's old compatibility hash. Those exact
expectations were corrected without weakening native contracts or authority.
The first full package run failed seven cases, including the real info/doctor
omission and the obsolete metadata SemVer assertion. Failures remain in their
original logs. Focused strict controls pass 18/18, identity controls 6/6,
empty-registry/version controls 19/19, installed package readiness 7/7 and the
final full unit suite 298/298; all have zero skips. Full registry passes 66/66.
Maintained strict checking reports zero errors/warnings and production build
passes. Its full component execution subsequently passed 441/441 and its full
package execution passed 10/10, zero failures/cancellations/skips (572.47 and
513.97 seconds respectively). The unchanged owned `.1` copy's full Chromium run
subsequently passed 733/733 (2791.63 s); its full integration run failed as
recorded below. These outcomes do not certify replacement `.2` identity.

The candidate was developed in an owned isolated copy, then 70 exact tracked
files were promoted after checking clean source HEAD and each baseline digest.
Generated caches/archives were excluded. Live producer preparation and frozen
strict install passed, followed by actual CLI compilation/bundling and live
contract validation with zero errors/warnings. Two contract script attempts
started before preparation finished and failed package-manager automatic
dependency verification; their failures are retained. Direct repository
contract validation passed; the portable candidate's complete contract outcome
and fixture-input correction are recorded below.

Current logs use the `r11-f02-adoption-` prefix. Fresh-source bootstrap uses
`r11-f02-fresh-adoption.log/json`; failed first runs retain their names.
Current guidance distinguishes this native candidate from historical upstream
failures, final cumulative qualification and mandatory independent acceptance.
Native boundary dispositions affected by the selected pins remain an F05
obligation. The portability discovery below prevented committing this candidate.

## R11-F02 — Portable .2 packaging correction and requalification

A fresh owned Linux producer refused the frozen emitter archive integrity. The
actual macOS and Linux emitter archives have equal length (161842 bytes) and
differ at precisely offset 9: gzip's OS marker is 19 on macOS and 3 on Linux.
The diagnostic only retained genuine archives from isolated builds before the
integrity refusal; it changed no declarations, source correction or package
store and did not waive the failed frozen install.

The producer now canonicalizes that packaging marker to 255 (unspecified) on
the genuine emitter/native archives, with zero timestamp, verified header and
unchanged decompressed content/CRC. The recipe records this policy. Distinct
build versions `0.7.34-svelte-ui-kit.2` and `2.19.5-svelte-ui-kit.2` avoid
reassigning the historical `.1` artifact. The emitter/native frozen inputs
were deliberately refreshed through the actual owned producer; ordinary
preparation remains frozen and authenticated. A regression compares Linux/macOS
header controls, proves equal normalized bytes/content and rejects corrupt
headers, timestamps and CRC without overwriting the invalid input.

The new native archive SHA-256 is
`1384075b9d764f80b92a94e378f233c2382dd6125fb3c301ae46be6d7746e603`;
its inner provenance SHA-256 is
`8f8bb9d4b0cf603a82780778f4c3bbdfc5d9ff69060fd8b3df6c3338e1b1b4f2`.
The two fixed distributions contain the same 981 inventoried files, with 980
byte-identical and only the package manifest's build version changed. Component
declarations, runtime, notices and the minimal source patch remain identical.
Provenance separately records changed version, recipe, lock and archive
identities. Current root/fixture/registry metadata and guidance use `.2`;
registry content hash is
`749afb9073343521213c7dc11d6f5c61a16e8edaa01a92b5634d2a5a6867964f`.
Generated `.1` cache/evidence is retained; only its authenticated superseded
member was removed from owned compiler bundle staging before the `.2` build.

Current guidance introduced three real links absent from the isolated contract
fixture allowlist. The full regression failed 137/159 (22 passing, zero skips).
The allowlist now includes the actual repair report and portable producer
README/recipe/patch, and the existing missing-target/full-tree control covers
these inputs. Its owning regression passes 1/1, zero skips; the complete rerun
passes 159/159, zero skips/cancellations (1062268.64325 ms). No placeholder or
disabled link/authority check is used.

Fresh Linux harness setup failures (missing executable alias, then a readonly
nonexecutable tool link) are retained separately from the genuine integrity
failure. The first portable run completed fresh production, frozen install,
CLI bundling and raw strict zero diagnostics, then failed its obsolete `.1`
digest locator. The corrected harness derives locators from actual metadata.
Logs use `r11-f02-native-linux*` and `r11-f02-gzip-diagnostic*`.

Current `.2` producer regression passes 3/3, zero skips (127554.184458 ms):
two fresh frozen native builds have identical archive bytes, the authentic
unpatched control still fails with two TS2590 errors, and actual positive/
negative public types, Svelte bindings and production consumers preserve their
contracts. Current preparation/tarball delivery passes 2/2, zero skips
(60421.067209 ms), including actual compiled pack extraction and raw strict
install/reinstall after author/CLI removal. Root `.2` frozen strict install
and authentic CLI bundling pass. Fresh Linux arm64 preparation from owned source,
frozen strict installation, CLI build/bundling, exact native archive digest and
raw strict checking all exit zero. Node 24.21.0 / pnpm 11.22.0 run in image
`sha256:3d27e5c11e5786e309ec3e03f93ae536eb36e6e5eb3714d5eb3300a36157add0`;
the source transfer archive SHA-256 is
`2b475229ab8c385dc21acb3c437dfe9b09ce9f22b13e64b93102d2a6bff64a79`.
The container is removed after execution. This is local Linux producer/strict
evidence, not a hosted workflow or Linux browser result.

Current `.2` macOS unit, registry, component and package suites pass respectively
298/298 (34.00 s), 66/66 (115.10 s), 441/441 (566.79 s) and 10/10 (551.22 s),
with zero skips/cancellations. The eight affected native-installation/dependency
instruction integration files pass 41/41 (247.09 s), also zero skips.
All six root typechecks, lint, format check, live contract validation and the
maintained production build pass. Raw transcripts use `r11-f02-portable-*`.
The current full Chromium qualification passes 733/733 (2390.73 s), zero skips
and zero retries, with one worker. It covers actual default/custom installed and
packed consumers, production SSR/hydration, native comparisons, interactions,
themes, forms, cleanup and causal controls. Remaining cumulative release lanes
belong to R11-F06/S201.

The obsolete isolated `.1` full integration run completed with 812 passes and
33 failures out of 845, zero skips/cancellations (2486.05 s). Eight files failed:
copied physical consumers omitted their declared authenticated native archive,
Info retained old registry/version-only readiness expectations, Menu retained
the old runtime pin, and five planned-consumer controls invoked obsolete shared
tool paths after the live `.2` frozen installation. That result is retained as
`r11-f02-adoption-integration-final.log`; it does not qualify `.2` or waive a
failure. Current copied physical fixtures now retain the real application-owned
native source, and Info's positive native readiness uses the genuine installed
distribution rather than a fabricated package manifest. Current owning reruns
cover every failed file without weakening transaction checks or strict checking:
all eight files pass 41/41, zero skips/cancellations (146.23 s), including real
SIGKILL recovery, complete-tree lifecycle/disposition checks and actual planned
consumer check/build/SSR. Six root typechecks and lint pass after those fixture
repairs. No product guard is relaxed. Checksum-verified actionlint 1.7.12 exits
zero over the actual native-bootstrap workflow; its owned tool directory is
removed. The remaining full-CI repair remains R11-F04, not this bootstrap change.

Read-only preservation checks confirm all 203 original checkpoint definitions
are byte-identical to `a176387`, all 95 immutable design-source hashes match,
both reference repositories retain their exact clean revisions, and the parent
index is unchanged. The derived checkpoint projection remains unchanged after
explicit regeneration. Six hundred detailed obsolete `.1` evidence files were
retained with authenticated hashes and explicit historical attribution.

R11-F02 portable adoption is a verified implementation candidate. The exact
native correction, archives, preserved type/runtime boundaries and actual local
delivery are qualified by these owning lanes. The full amendment and final
cumulative release gate remain outstanding; this slice grants no independent
acceptance or S201 completion.

The portable adoption is committed at
`909eaba7aefcb1f8552dad8307470c5109a9014b`.

## R11-F03 — Read-only unchanged-command safety

Unchanged init/add/sync now share `inspectUnchangedState` before returning
`no_change`, including dry runs. The caller supplies its independently resolved
mapping. Non-following physical inspection precedes writer coordination, then
journal qualification and pending-state disposition. The inspection never
acquires a writer, recovers, cleans or manufactures a write. Clean absent state
and harmless empty namespaces retain exit-0 replay without project writes.

Valid writer evidence produces `WRITER_BUSY`; ambiguous/unreadable ownership
produces `WRITER_LOCK_UNAVAILABLE`. All retained transactions are inspected
before a generic pending result, so a corrupt later journal cannot hide behind
an earlier empty transaction. Mapping/root/inventory/created-directory and
publication witness checks reuse the existing recovery proofs. Valid committed
cleanup produces `RECOVERY_PENDING` while preserving subsequent application
edits. Diagnostics retain causal codes with independently rooted logical
locators, without exposing arbitrary journal paths or transient identifiers.
Journal reads now preflight ancestry and regular-file kind so read-only
diagnosis cannot open a retained FIFO or follow a linked journal.

The owning macOS integration run passes 172/172 across 17 files, zero skips,
failures or cancellations. Its 50 new controls cover default/custom mappings,
all three commands and dry runs, unsafe links/FIFOs, malformed and foreign
records, writer priority, unknown inventory, genuine SIGKILL publication and
released-but-retained cleanup, post-crash edits, exact tree preservation and
human stderr errors. Permission denial is observed as actual EACCES under the
unprivileged owner. Removing only the inspection in an owned executable copy
causally restores the original silent success; restoring it restores refusal.
The existing full-journal, publication, process, durability, cleanup, recovery
and filesystem assertions remain green.

The actual installed-tarball runtime file passes 4/4, zero skips. After removal
of the owned authoring copy, both mappings and all three commands refuse writer
and pending transaction state. An owned copy of that actual installed artifact
with inspection removed restores silent success. Runtime guards record no
authoring-source, network or subprocess access. The public protocol controls
pass 10/10. CLI build, lint, all six root typechecks, format and live contract
validation pass. Transcripts use `r11-f03-*` in the ignored logs directory.
Twelve additional fresh-process diagnosis invocations of strict doctor, info
and view cover real FIFO and linked journals in both mappings. Doctor refuses
with `RECOVERY_UNSAFE_TARGET` without blocking; info/view remain read-only.
Complete project trees and the linked external evidence remain unchanged.

A fresh local Linux arm64 transfer prepares the authentic native dependency,
installs frozen strict peers/engines, builds the CLI and passes the same 172/172
integration controls under uid/gid 65534, zero skips/cancellations. The owning
container is removed. Total preparation/install/build/test duration is
298853 ms; process exit is zero with no signal or error. The pinned image is
`sha256:3d27e5c11e5786e309ec3e03f93ae536eb36e6e5eb3714d5eb3300a36157add0`;
source transfer SHA-256 is
`4d85319c90c1d434de55365acb9858f94d719422d577435926012e698038c072`.
The source inventory, raw transcript and actual case-sensitive filesystem
observations remain under `r11-f03-linux-replay`. This qualifies the executed
local Linux lane, not hosted CI, Windows or hostile concurrent races.

The initial owning run passed 35/56 and failed 21, zero skips/cancellations:
the new custom fixture put configuration at an unsupported root path and then
asserted against an unused custom namespace. Its failure remains retained as
`r11-f03-initial-owning.log`. The fixture now seeds the real custom `_kit`
configuration path; no product guard or recovery assertion was weakened.
Current owning qualification is green. R11-F03 is a verified implementation
candidate; independent final acceptance and S201 remain open.

## R11-F04 — Complete isolated acceptance CI

The workflow replaces the previous serial 30-minute job and browser-harness
selector with nine independent job definitions: foundation, integration,
components/registry, package, consumer strict/production/SSR, full Chromium,
contracts, native producer/delivery, and the Linux/macOS filesystem matrix.
Every job owns a full checkout, pinned actions and exact Node/pnpm setup. Each
prepares the authentic native archive before frozen strict peer/engine install.
Shared writers stay serial inside a job; artifacts never cross jobs. Read-only
permissions, no retained checkout credentials, unfiltered source triggers and
no publication/deployment/secret operation remain explicit.

The current command map records every job's bounded timeout and the actual
local measurements informing its headroom. Integration/browser have 120-minute
bounds; components/consumer/filesystem have 60; package/contracts/native have
45; foundation has 30. Historical failed integration timing is labeled as
timing evidence, never acceptance. Conservative hosted headroom is configured;
actual hosted timing and execution remain unqualified. The remaining current
cumulative lanes belong to R11-F06 rather than a repeated, mislabeled remote run.

The repository-owned YAML policy and meaningful controls validate exact job
coverage, complete underlying scripts, preparation/install order, tool/action
pins, full history, both filesystem platforms, timeout rationale and strict
failure handling. They reject missing jobs, selectors hidden in scripts or
comments, relaxed installs, unsupported overrides, conditional skips, failure
masks, unsafe permissions and consumer library/warning suppression. YAML
2.9.1 is an explicit pinned development dependency using its documented
[parser API](https://eemeli.org/yaml/#parsing-documents); no CLI runtime
dependency or application pin changes. This also resolves
Vite's optional YAML peer in the root/fixture lock graph. The current raw strict
and production/SSR runs qualify that graph; final cumulative qualification
remains required. Authentic linked policy files are included as real inert
contract fixture inputs, with byte-preservation and authority controls retained.

Current owning results are green: YAML coverage reports zero issues; its 20/20
controls pass with zero skips/cancellations. Checksum-authenticated actionlint
1.7.12 validates the actual complete workflow at exit zero, including available
shellcheck 0.11.0. The owned actionlint tool is removed and its checksum/process
records remain retained. Frozen strict install, CLI build, 298/298 unit tests,
39/39 harness tests (76022.328791 ms), 44/44 CLI smoke tests (10329.677625 ms),
all six typechecks and lint pass. Actual package inventory/metadata controls
pass 2/2. Raw consumer checking reports zero errors/warnings. The complete
production/SSR smoke command passes 27/27, zero skips/cancellations; its Node
test portion takes 52548.860459 ms and the maintained production build passes.
The linked-guidance contract fixture passes 1/1 without importing live authority.
Raw transcripts use `r11-f04-*` under the ignored logs directory.

The first complete SSR run passed 25/27 and failed two, zero skips/cancellations
(25042.585958 ms for its Node test portion). Default/custom Q2 consumers copied
the genuine manifest and physical installation but omitted the declared native
archive. The production authority correctly refused `AUTHORITY_INSTALLED_CHANGED`.
Their setup now retains the real `.native-build` source alongside the manifest;
the full check/build/SSR rerun passes without changing the production guard or
any lifecycle assertion. The failed `r11-f04-fixture-ssr.log` remains evidence.

R11-F03 is committed at `9fe3668451763bd89bdf88f43d1bad7a7a668a44`.
R11-F04 is a verified CI implementation candidate. No hosted workflow,
independent acceptance or final S201 pass is claimed by this checkpoint.

## R11-F05 — Current guidance and evidence-backed boundary dispositions

Current README, CONTRIBUTING, the operations runbook, open-question table,
verification policy, compatibility/accessibility/platform records and complete
R01–R34/AC01–AC22 traceability now agree with the implemented candidate.
Installation explicitly retains the authentic application-owned native file
dependency, rather than suggesting a registry release. Browser guidance uses
the full configured suite, consumer SSR names all four actual suites, and CI
describes the nine isolated configured jobs without claiming hosted execution.
Historical checkpoint-era pending prose in component maps and the original
S201 strict failure is visibly qualified as provenance. Original gates through
S193 remain accepted; the current native candidate and final sequence are not
self-accepted.

The selected native baseline's complete 733-case F02 run reconfirmed direct
native/generated reset cancellation, force-mounted pointer locking, first-open
callbacks, relation registration, CSP and adverse clipping controls. Current
F05 catalog/identity SSR replays additionally reconfirm native nonsemantic
floating process-counter allocation, semantic ID uniqueness/request locality
and actual request-state isolation on the final YAML peer graph. No kit identity,
presence, form or positioning engine is invented. Current compatibility records
link each boundary's actual owning tests and qualify browser/filesystem limits.
The original Radio/Switch nontext ratios remain measured source concerns under
AC18; no palette redesign or universal accessibility claim is introduced.
The separate final reviewer must assess any required unresolved violation.

F02's actual browser output is preserved before cumulative rerun: 1556 files
were copied byte-for-byte with a complete SHA-256 inventory, including all four
rendered-contrast mapping/direction records. The source run's final status is
passed with no failed tests. Retained records are under
`logs/r11-f02-portable-browser-artifacts/` and
`logs/r11-f05-native-boundary-inventory.json`; this retention is not a new browser
execution. The native archive remains the selected authenticated `.2` bytes.

The busy-lock diagnostic now matches the verified runbook: preserve evidence,
verify an external backup, independently establish the recorded owner's exit
and cessation of all writers, and quarantine only the verified coordination
directory without deleting transaction evidence. PID age/death grants no
ownership. Command behavior, statuses and wire schema remain unchanged.
Contract fixtures include the actual newly linked controls as inert inputs;
no stubs, link-check suppression or imported live authority is used.

Actual current verification, with zero skips/cancellations:

| Lane                                                             | Result               | Duration  |
| ---------------------------------------------------------------- | -------------------- | --------- |
| Five documented workflow/recovery/catalog and identity SSR files | 16/16                | 288257 ms |
| Protocol guidance/envelopes                                      | 10/10                | 1787 ms   |
| Actual installed-tarball runtime/unchanged-state controls        | 4/4                  | 135379 ms |
| Complete registry/traceability                                   | 66/66                | 80171 ms  |
| All six TypeScript configurations                                | exit 0               | 8962 ms   |
| Full lint                                                        | exit 0               | 5361 ms   |
| Full formatting check                                            | exit 0               | 7614 ms   |
| Live contracts                                                   | zero errors/warnings | 5070 ms   |
| Real linked-guidance fixture                                     | 1/1                  | 1243 ms   |

CLI build/authentic bundling also passed. Exact command arrays, source inventory,
raw transcripts, statuses/signals/errors, durations and log SHA-256 values are
retained in `logs/r11-f05-owning-outcome.json` and `r11-f05-owning-*.log`.
The documented procedures run against actual installed archives, including
whole-tree customization/conflict/recovery preservation. Existing examples and
notices remain valid; full current example/interaction qualification follows
in F06. Full 159-case contract regression is a required F06 lane after these
fixture-input changes. No original checkpoint definition or immutable design
source is changed, and original progress remains 200 candidates/193 accepted.

## Remaining implementation and acceptance

Planning input maintenance, R11-F01 diagnosis and the R11-F02 producer and
authenticated-transport slices are verified candidates. The producer emits
corrected native declarations and real local delivery is qualified on the
initial baseline. The portable `.2` adoption candidate passes its required
strict, delivery and runtime lanes. Independent acceptance
remains open.
Original progress remains 200 implemented candidates and 193 independently
accepted checkpoints. R11-F03 no-change refusal and R11-F04 complete CI coverage
are verified candidates. R11-F05 guidance/boundary reconciliation is also a
verified candidate. R11-F06/S201 full cumulative release checks,
S202 extension reconciliation, S203 delivery and separate final acceptance of
S194–S203 remain required. The corrected candidate passes raw strict checking;
the remaining amendment and cumulative obligations still block S201 completion.
No S201 implementation commit or independent acceptance is
manufactured by this report. Continue to record actual repair outcomes here;
the governing plan and existing tracker retain execution authority.
