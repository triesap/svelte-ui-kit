# RCLD-11 independent final qualification

Separate reviewer: Codex independent acceptance reviewer. Date: 2026-10-09.
Decision: accept original S194–S203 and the approved R11-F01–R11-F06 repairs,
within the documented local MVP qualification below. No blocking finding remains.
The reviewer authored no product, test, dependency or specification repair.

The independently reviewed clean candidate is
`b174b5ae8ffd4eead61df5e846ea4d39ac14ec74`. This decision does not manufacture an
evidence commit. The live ledger still records 203 implemented candidates and
193 independently accepted checkpoints until the coordinator commits this plain
evidence and performs the valid transition at that reachable anchor. Acceptance
of this final sequence completes the original core qualification; it does not
authorize publication, deployment or the separately gated extension scope.

## Authority, identity and preserved scope

The reviewer inspected current `AGENTS.md`, `implementation/COMMIT_SEQUENCE.md`,
the approved completion amendment, adopted specifications, all ten original
checkpoint definitions, reports, actual implementation/tests and installed
consumer/native artifacts. Reports supplied provenance rather than acceptance.
All 203 original definition bodies match `a176387` exactly. All 95 immutable
design registry/manifest/source/style hashes in `tests/fixtures/catalog-source.json`
match source revision `a10fbf06334f4648f5755e05a7147414e4e5fc98`. The native source
reference remains `fd10616a873a8e6e3652e31dcc88c5c2f155a9e2`. Both references are
unchanged. The accepted S001–S193 prefix, unrelated changes and repository
boundaries are preserved.

The original implementation hashes remain in the S194–S203 reports and reviews.
R11-F02 portable adoption is `909eaba7aefcb1f8552dad8307470c5109a9014b`, F03 safety
is `9fe3668451763bd89bdf88f43d1bad7a7a668a44`, F04 CI is
`415d79350ab42bde160f12c6e83f0a15d4c438a4`, and F05 current native/runtime
qualification is `7756b5cbb53d5be7f6c25622e57da78edb283f51`. Subsequent changes
are documentary/authority annotations and explicit linked-document fixture inputs;
product/runtime/test/native/CI inputs are unchanged. Independently rehashed all
1,207 entries in `implementation/evidence/logs/s203-freeze-outcome.json` against
the reviewed candidate after the replays: zero mismatch.

## Fresh independent execution

`cargo extbuild doctor` exited 0 before mutating verification. Commands below ran
through `cargo extbuild run --`, with Node 24.21.0 and pnpm 11.22.0 selected.
Shared compiler, package, fixture and browser writers were isolated. Logs use
the unique `implementation/evidence/logs/r11-independent-` prefix; historical
evidence was retained. Every listed lane exited 0. Test lanes have zero failures,
cancellations, skips and TODOs; browser retries are zero.

| Independently executed command/lane                                                                                                                                                                                                                                          | Result                                                                  | Retained log suffix                                                                |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `node --test --test-concurrency=1 tools/build-native-dependency.test.mjs tools/prepare-native-dependency.test.mjs`                                                                                                                                                           | 5/5                                                                     | `native.log`                                                                       |
| `pnpm run build`                                                                                                                                                                                                                                                             | pass                                                                    | `build.log`                                                                        |
| `node tools/run-unit-tests.mjs --suite integration tests/integration/unchanged-state.test.ts tests/integration/docs-upgrade.test.ts tests/integration/documented-workflow.test.ts tests/integration/docs-recovery.test.ts tests/integration/native-local-dependency.test.ts` | 71/71: safety 50, recovery 8, upgrade 2, workflow 2, native delivery 9  | `integration.log`                                                                  |
| `node tools/run-unit-tests.mjs --suite package`                                                                                                                                                                                                                              | full 10/10                                                              | `package.log`                                                                      |
| `node tools/run-unit-tests.mjs --suite components tests/components/strict-declaration.test.ts`                                                                                                                                                                               | 18/18                                                                   | `strict.log`                                                                       |
| `pnpm run fixture:check` / `pnpm run fixture:build`                                                                                                                                                                                                                          | raw strict check zero errors/warnings; production build pass            | `fixture-check.log`, `fixture-build.log`                                           |
| Direct `pnpm exec playwright test --config playwright.config.ts --output=implementation/evidence/logs/r11-independent-browser-artifacts` with the sixteen owning specifications below                                                                                        | 222/222, 13.4 minutes                                                   | `browser.log`                                                                      |
| `pnpm run check:ci` / `pnpm run test:ci`                                                                                                                                                                                                                                     | nine isolated job definitions, zero issues; 20/20 semantic/causal tests | `ci-check-pinned.log`, `ci-test-pinned.log`                                        |
| `node tools/run-unit-tests.mjs --suite registry tests/registry/contract-links.test.ts`                                                                                                                                                                                       | 3/3                                                                     | `traceability-pinned.log`                                                          |
| `node --test --test-name-pattern="linked operating guidance" tools/check-contracts.test.mjs`                                                                                                                                                                                 | 1/1 selected guidance/fixture causal case                               | `guidance-pinned.log`                                                              |
| `pnpm run typecheck` / `pnpm run lint` / `pnpm run format:check` / `pnpm run check:contracts`                                                                                                                                                                                | six root TypeScript configurations and remaining checks pass            | `types-pinned.log`, `lint-pinned.log`, `format-pinned.log`, `contracts-pinned.log` |

The sixteen browser specifications are `forms-composition`, `modal-force-mount`,
`catalog-hydration`, `dialog-interactions`, `alert-dialog-interactions`,
`menu-keyboard`, `menu-csp`, `collapsible-csp`, `accessibility-states`,
`composition-examples`, `packaged-consumer`, `identity`, `catalog-themes`,
`menu-placement`, `wrapper-contracts` and `avatar`, under `tests/browser/`.
They exercise actual default/custom installed consumers, paired native controls,
strict lifecycle collectors and application-owned causal mutations. The reviewer
independently compared 198 nonmutation browser provenance records and 8,802
installed template hashes with the current registry: zero mismatch. Mutation
controls were deliberately excluded from byte-parity claims. The complete
retained author browser evidence was also independently authenticated, rather
than extrapolating these 222 cases to the full suite.

The final short static group initially resolved Node 26 and emitted the engine
warning despite successful exits. Those supplementary logs remain; every command
in that group was repeated with an explicit Node 24.21.0 PATH, and only the
`-pinned` outcomes above supply the selected-toolchain qualification. Earlier
native/runtime/fixture/browser lanes were correctly pinned. Node's
`NO_COLOR`/`FORCE_COLOR` tool-environment messages remain in raw logs; zero
unexpected page/console/hydration/lifecycle errors and raw consumer compiler
warnings are the tested requirements, not a claim that every tool prints nothing.

The reviewer additionally repeated all 17 filesystem owning files in an isolated
Linux container, **172/172**, as uid/gid 65534 with actual EACCES controls. Evidence
is `implementation/evidence/logs/r11-independent-linux/raw.log` and `details/`.
This replay uses the authenticated F06 archive at `7756b5c`, not a fictitious fresh
documentary snapshot of `b174b5a`; all executable/filesystem test inputs match the
current candidate. Archive SHA-256 is
`f280ebe938fa8ec227f4cc952fd1fe071d293d83ef375c6636867e7addf27902`, and image
digest is `sha256:3d27e5c11e5786e309ec3e03f93ae536eb36e6e5eb3714d5eb3300a36157add0`.
Native preparation, strict frozen install and build genuinely ran before the
unprivileged tests. Container-owned storage was used and the owned container was
removed after completion; no other machine was changed.

## Authenticated cumulative evidence and artifact

The reviewer authenticated actual outcomes, raw totals, log hashes and source
inventories in `r11-f06-foundation-outcome.json`, `r11-f06-root-outcome.json`,
`r11-f06-contract-outcome.json`, `r11-f06-qualified-freeze.json`,
`r11-f06-browser-replay-final/` and `r11-f06-linux-replay/`, all under
`implementation/evidence/logs/`. All recorded commands exited 0 with no process
signal/error. Each of the 1,202 F06 source hashes was checked against the actual
`7756b5c` Git content; no mismatch. Twenty-eight retained outcome/log digest
entries were authenticated. Historical input identities are not relabeled as
current document inputs.

The genuine full current-product cumulative totals are unit **298**, integration
**895**, registry **66**, components **441**, package **10**, Chromium **733**,
consumer SSR **27**, harness **39**, CLI **44**, CI **20**, contracts **159**,
native producer/delivery **5**, and unprivileged Linux **172**. These are reused,
authenticated author executions, not claimed as newly executed reviewer totals.
All have zero failures/skips/cancellations/TODOs; full browser has zero retries.
Actual frozen strict install, six root types, raw strict consumer checking,
formatting, lint, production builds, CI coverage and packaging passed on the
same product input. The full integration includes the same 17 macOS filesystem
owning files.

The full browser replay used an owned physical source copy and a genuinely fresh
frozen install; `cleanup: true` and `sourcePreserved: true` are supported by the
recorded inventory and absence of the removed owned project. Native archive
identity is the current `.2` artifact. Independently compared 598 retained
nonmutation provenance records and 12,514 installed template hashes with current
source: zero mismatch. The earlier copied-node_modules setup failure remains in
`r11-f06-browser-replay/`; no browser tests ran there. The corrected, separate
full 733-case run is the accepted evidence.

The final document-input full contract regression in `s203-contract-outcome.json`
and its raw log passed **159/159** in 634,982 ms. `s203-final-outcome.json`,
`s203-source-freeze.json` and `s203-freeze-outcome.json` authenticate the subsequent
document-input static/traceability/package/guidance/preservation checks and
1,207 current hashes. The first annotations EEXIST setup failure is retained;
the distinct verified rerun passed without a product/assertion change. This
review freshly replayed live validation and relevant causal/linked-guidance
checks. A full contract regression after the reviewer documents and atomic
acceptance records is a coordinator closure check, not an invented result here.

The actual S203 inspection artifact
`implementation/evidence/logs/s203-packed/svelte-ui-kit-0.1.0.tgz` has SHA-256
`614e53da9c64a4be1013a36e1d222497199660166ce460bacb32b2c643cf3d5a`.
The reviewer inspected all **241** unique regular permitted paths and modes;
there are no traversal paths, links or duplicates. Comparing actual member bytes
and modes with the full-qualified earlier artifact
`cfe7ae7bc174e04a866f738e80e8b9265653881d4d07936e63ef7904375315f0`
shows only `README.md` differs; the other 240 members and all modes match.
The executable SHA-256 is
`fdf252d47a0771ced9f9fb4ff942e1ae1413217742903bc60f56113fc0aa064a`.
The embedded native archive remains the exact current qualified artifact below.
Fresh full package and packaged browser tests independently rebuilt/packed,
installed offline, removed owned author/CLI sources, and checked/built/rendered
the complete 22-item catalogs in default/custom layouts with all advertised
value/type imports. Safe, customized and conflicting upgrade cohorts and pure
replays are genuine. The final accepted-document tarball, if repacked by the
coordinator, needs its own actual identity; none is predicted here.

## Native source repair and portable delivery

Current pins are Node 24.21.0, pnpm 11.22.0, TypeScript 6.0.3, Svelte 5.57.1,
SvelteKit 2.70.3 and actual locally produced Bits
`2.19.5-svelte-ui-kit.2` with emitter `0.7.34-svelte-ui-kit.2`.
Native archive SHA-256 is
`1384075b9d764f80b92a94e378f233c2382dd6125fb3c301ae46be6d7746e603`,
provenance SHA-256 is
`8f8bb9d4b0cf603a82780778f4c3bbdfc5d9ff69060fd8b3df6c3338e1b1b4f2`,
and registry digest is
`749afb9073343521213c7dc11d6f5c61a16e8edaa01a92b5634d2a5a6867964f`.

The reviewer inspected the actual installed declarations, Svelte component type,
compiler limit evidence, producer recipe/patch/locks, native delivery code,
provenance schema, licenses and native preservation controls. The source-level
emitter shim returns the structural Svelte component call contract with exact
`Props`, `Exports` and binding marker, avoiding the unnecessary binding-key
constraint union product. Native components keep their actual props, refs,
snippets, state-binding keys, discriminants, attributes, callbacks and return
contract. It does not add a construct signature or erase types. Existing upstream
type annotations are preserved; no new `any`, suppression, skipLibCheck,
compiler-limit patch, declaration/store patch, hidden import or SSR-disable
workaround supplies acceptance. Supported public root native imports remain the
actual boundary.

The fresh five-test producer lane built the real producer twice, authenticated
the selected patched emitter, and produced byte-identical archives. In
`implementation/evidence/logs/native-producer/95814-1791515136983.json`, 694 native
runtime/prop/noncomponent files are byte-identical to the unpatched same-version
control. The unpatched raw consumer genuinely fails with the two TS2590 errors;
corrected raw `skipLibCheck: false` consumer checking and raw TypeScript checking
exit 0 with zero errors/warnings. Positive props/component/binding controls pass;
each of ten invalid type controls fails, including unsupported construction and
actual unsupported `bind:disabled` on Button/Calendar. All owned producer
projects were removed. This is a supported selected-baseline qualification,
not proof of exhaustive equivalence for every future compiler/dependency.

Canonical gzip header normalization changes only nondeterministic metadata,
preserving decompressed content/CRC. Current `.2` is genuinely reproducible;
historical `.1` evidence is not borrowed. Source revision, exact patch, producer
inputs, license/notice closure, inventories and digests accompany the delivered
archive. The provenance reader refuses unknown fields/versions, extra/missing
files, links and corrupt bytes. Real application-owned `vendor/` file dependency
survives removal of the author and installed CLI host. Dependency copying/setup
is explicit; the CLI does not install dependencies or rewrite package manifests.
Calendar appears as an existing native strict control, not a new kit extension.
The historical `S196_STRICT_ASSESSMENT.md` is diagnostic evidence; its selected
upstream blocker is resolved by this independently tested approved repair.

## Safety, CI and required-issue disposition

The shared no-change boundary performs physical safety and coordination/recovery
inspection before returning success for normal/dry init/add/sync. It detects
busy ownership and complete pending/corrupt journal state without creating a
writer, recovery operation or cleanup. Actual SIGKILL, post-crash edits,
FIFO/link/unreadable/EACCES and complete-tree purity tests include compiled
omission controls. Safe replay stays unchanged; unresolved state refuses
truthfully and preserves evidence. No speculative scan/automatic application
rewrite or new recovery policy was introduced.

The nine-job YAML policy was inspected semantically and freshly tested with
causal omissions. All required suites, full browser execution, selected pins,
native preparation before frozen strict install, history, permissions, immutable
action references, isolated writers and measured bounded budgets are enforced.
Local cold Linux bootstrap and corresponding suites actually executed. Hosted
CI remains configured and unexecuted; remote success is not claimed.

The reviewer independently assesses the source nontext concerns as documented
baseline concerns permitted by original AC18, rather than passing 3:1 results.
Fresh actual installed AX/keyboard/RTL/motion/contrast tests establish the required
semantic/state/geometry behavior. All 23 measured visible ordinary text pairs
per lane pass 4.5:1, minimum 4.615804459238792. Unchecked Radio boundary contrast
is 1.4735129263833868, and the source Switch track/thumb pair is
2.5388412065932826; both are below 3:1 and remain visible in evidence/guidance.
Original AC18 expressly requires documenting baseline concerns and the source
styling contract preserves the source palette. It does not impose universal
WCAG certification or an unapproved palette redesign. No additional demonstrated
violation of a required original criterion remains undisposed. This decision
does not classify those low-contrast pairs as compliant: application-level WCAG
claims require their own assessment and, where necessary, explicit overrides.

Current native boundaries were replayed against actual selected `.2` controls:

- Trusted reset-click cancellation can still reset raw Svelte and Field text;
  application-invoked native `form.reset()` cancellation preserves both. The kit
  does not invent a reset engine or claim stronger behavior.
- Closed nondelegated force-mounted Dialog/Alert content owns native body scroll
  and pointer locking. Paired native/generated default/custom controls prove
  blocking, preventScroll/delegated alternatives and real teardown restoration.
  Hidden retained content isolates body locking; these controls do not certify
  arbitrary overlays or caller animations.
- First-open native completion callbacks and SSR child registration have the
  observed native timing bounds. Initial accessible names can require explicit
  caller `aria-label`; hydration relationships resolve without unexpected errors.
- Native floating wrapper allocation uses a process-global counter. Semantic
  identities/request values remain isolated, document IDs unique and all semantic
  references resolvable. Identical allocation-only wrapper IDs across requests
  are not promised; no kit global server state was introduced.
- CSP tests measure actual nonce/self stylesheet and allowed/forbidden attribute
  policies. Exact expected native policy violations are scoped and retained;
  other lifecycle exceptions fail. No universal zero-inline-style claim exists.
- Real transformed/clipped custom portal hosts preserve browser clipping and
  stacking. Global/nested open-overlay theme changes work as documented.
  Avatar stale/detached image callbacks and SSR event-recorder boundaries retain
  native lifecycle ownership and strict collectors.

## Original acceptance criteria

All R01–R34 entries in `implementation/TRACEABILITY.md` have real implementation,
test or explicit qualified-boundary evidence. Original S194–S203 criteria are
individually assessed in the adjacent plain reviews. The following dispositions
apply to every original acceptance criterion, including the completion amendment.

| Criterion | Independent disposition and principal evidence                                                                                                                                                                                                                                                                                 |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC01      | Pass: packed source-first CLI/assets/schema/contracts; actual local imports and no styled kit runtime in full package/source-removal controls.                                                                                                                                                                                 |
| AC02      | Pass: exact requested closure, flat public exports, generated ownership/CSS/layout contracts; complete installed catalogs, current maps and authenticated registry/component lanes.                                                                                                                                            |
| AC03      | Pass: offline installed CLI commands and actual consumer dependency setup work after owned author/CLI removal; authentic application-owned native archive.                                                                                                                                                                     |
| AC04      | Pass: authenticated full CLI/harness/argument/JSON/error lanes; fresh no-change diagnostics and unsafe-path controls preserve public logical locators.                                                                                                                                                                         |
| AC05      | Pass: pure info/dry/doctor/replay plus fresh 50 causal unchanged-state cases and complete-tree snapshots.                                                                                                                                                                                                                      |
| AC06      | Pass: explicit roots, truthful closure/provenance/retirement, preserved customization/manual-import guidance; prior independently accepted retirement repair and unchanged full current integration.                                                                                                                           |
| AC07      | Pass: all equality combinations/source/CSS, collision/missing-target policies and actual packed safe/custom/conflict cases; no silent adoption.                                                                                                                                                                                |
| AC08      | Pass: coherent source/CSS cohorts refuse nonmutating conflicts and preserve truthful customized metadata; fresh packed consumer controls.                                                                                                                                                                                      |
| AC09      | Pass: preserved layout/export/application content and genuine mixed-barrel repair; full current unit/integration/component evidence, actual installed catalogs.                                                                                                                                                                |
| AC10      | Pass: real peers/ranges/roles and migration/schema refusal; explicit app-owned native dependency, no implicit installs/manifest edits.                                                                                                                                                                                         |
| AC11      | Pass within supported trusted-local threat model: full macOS and fresh unprivileged Linux owning safety files; unsafe physical/nonregular/case/path inputs and hostile-race bounds documented.                                                                                                                                 |
| AC12      | Pass within stated filesystem model: actual concurrent preimages/faults/SIGKILL/post-crash edits/corrupt recovery and fresh causal no-change inspection.                                                                                                                                                                       |
| AC13      | Pass: final coherent lock publication, deliberate cleanup/evidence retention and actual process termination controls, not only finally cleanup.                                                                                                                                                                                |
| AC14      | Pass: 22-item original catalog, 95 immutable design records/current maps, distinct Alert Dialog, early floating menu and native identity with no Rust shim.                                                                                                                                                                    |
| AC15      | Pass: raw strict zero errors/warnings, real producer repair and invalid controls; native bindings/refs/discriminants/snippets/event/return fidelity, current full components and fresh wrapper browser cases.                                                                                                                  |
| AC16      | Pass: fresh real form/overlay/menu/examples/feedback/binding controls and authenticated full 733 Chromium suite.                                                                                                                                                                                                               |
| AC17      | Pass with explicit native allocation/registration bounds: current raw strict, concurrent SSR27 and fresh identity/hydration/lifecycle controls; no hidden SSR-disable or kit mutable request state.                                                                                                                            |
| AC18      | Pass as specified: real DOM/pure CSS/tokens/radii/source geometry/RTL/motion; required source contrast concerns explicitly assessed above, no blanket accessibility certification.                                                                                                                                             |
| AC19      | Pass with measured boundaries: actual theme/custom portal/clipping/CSP cases and narrowly scoped expected policy errors.                                                                                                                                                                                                       |
| AC20      | Pass for selected local scope: authenticated full current cumulative lane plus fresh affected producer/safety/package/strict/browser/static replays; supported macOS/Linux safety qualified. Rust N/A for this TypeScript-only target. Windows and other browser engines remain unsupported/unqualified; hosted CI unexecuted. |
| AC21      | Pass at review level: all original steps retain real implementation commits/reports, accepted prefix and final separate reviews; docs/runbooks/examples/metadata/traceability current. Authoritative final evidence anchoring remains the coordinator's exact next action.                                                     |
| AC22      | Pass: exact Select/Combobox/Popover/date/higher-level missing contracts remain separately gated; no unspecified extension code or expanded-v1 delivery claim.                                                                                                                                                                  |

## Final decision and limits

Accept all ten original final-sequence checkpoints and all six approved repairs.
The local source-first MVP and its current artifact are independently qualified
against the original requirements and approved completion amendment. No required
issue remains blocked in that scope. Windows, Firefox/WebKit, broad speech or
WCAG certification, arbitrary caller themes/animations, hosted CI execution,
network/hostile filesystems and power-loss durability remain unqualified and are
not advertised as passed. Linux evidence qualifies the specified unprivileged
filesystem/tooling lane, not Linux browser rendering. Publication/name ownership
is not presumed; the package is private and no push, publish or deployment ran.

The exact next safe action is to commit these eleven plain independent documents,
then atomically anchor valid accepted records and final ledger projections at the
real reachable evidence commit. The coordinator must run closure validation and
record any accepted-document artifact identity from an actual repack. Extension
work requires the separately approved contracts and sequence; it is not the next
automatic implementation action. This document grants no future acceptance and
contains no invented evidence hash.
