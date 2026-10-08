# RCLD-06 independent qualification

Reviewer: separate Codex reviewer, not an author of product changes or maintained
tests. Date: 2026-10-08. Independently accepted committed source/test candidate:
`5c235eed860667d030c4f36e805d04f0acd2e91d`. Original implementation candidate:
`c94ea07133c42e98033eb8db02e9e9067ae2a415`, subsequently frozen with bookkeeping
at `4e0b00f5aa729feb3c5fc4fc45b27ad44a092d02`.

Disposition: **S092–S115 accepted** on the repaired candidate. The independent
gate is satisfied; the plain review documents must first be committed to a real
reachable evidence anchor, followed by the atomic accepted-record/ledger
transition before S116. S001–S091 remain accepted. All 203 original checkpoint
definitions were independently compared with `a176387` and remain byte-identical.
No whole MVP acceptance is claimed.

## Original checkpoint dispositions

Review compared the original checkpoint scope, acceptance obligations and required
checks with governing API, data, security, synchronization and acceptance
specifications, linked decisions, actual source/production callers, installed
consumer tests and reports. Narrow helper success alone did not establish this
gate. Every original checkpoint is explicitly disposed below.

| Checkpoint | Disposition | Original obligations reviewed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S092       | Accepted    | Portable vocabulary. The frozen semantic defaults, complete radius grammar, per-component customization vocabulary and upstream provenance agree with the original specifications; generated contracts preserve exact original declarations.                                                                                                                                                                                                                                                                           |
| S093       | Accepted    | CSS token foundation. The actual registered tokens foundation installs pure CSS, source defaults and semantic fallback declarations without a runtime token module or utility framework dependency. Reapplication is deterministic.                                                                                                                                                                                                                                                                                    |
| S094       | Accepted    | Truthful token and theme metadata. Versioned token/customization metadata is loader-authenticated from original bytes and emitted with truthful ownership, integration and cohort identities. Unsupported schema or changed owned declarations refuse rather than invent a migration or baseline.                                                                                                                                                                                                                      |
| S095       | Accepted    | Token override and radius behavior. Actual production CSS controls qualify semantic and component fallback precedence, complete radius forms, exact overrides and live theme/contrast observations. Computed layout evidence complements parser tests.                                                                                                                                                                                                                                                                 |
| S096       | Accepted    | Spinner public contract. Native typed Spinner props distinguish decorative and labeled modes without a redundant decorative announcement or a widened any-based contract.                                                                                                                                                                                                                                                                                                                                              |
| S097       | Accepted    | Generated Spinner. The real registry item installs typed source, managed CSS and dependencies in both supported layouts; generated consumers compile actual exports without private-source fallback.                                                                                                                                                                                                                                                                                                                   |
| S098       | Accepted    | Spinner geometry and motion. Installed production controls qualify size geometry, shape-critical radius, theme/override behavior, labels and reduced motion against actual generated CSS.                                                                                                                                                                                                                                                                                                                              |
| S099       | Accepted    | Button public contract. The exact native button prop/ref/children/form contract and closed variant/size vocabulary are preserved. A link-like replacement or widened any-based prop contract is not introduced.                                                                                                                                                                                                                                                                                                        |
| S100       | Accepted    | Generated Button. The native button preserves default type, classes/attributes/ref/children and loading-safe behavior, using direct installed Spinner/token dependencies and plain managed CSS.                                                                                                                                                                                                                                                                                                                        |
| S101       | Accepted    | Button interaction. Actual installed browser controls qualify keyboard/pointer activation, native forms, disabled/loading refusal, callback/ref forwarding, attributes, focus and variant/size styling.                                                                                                                                                                                                                                                                                                                |
| S102       | Accepted    | Switch public contract. The public Switch uses the exact pinned RootProps contract excluding child-render hooks; checked/ref binding, native form attributes and actual Root/Thumb selectors remain intact.                                                                                                                                                                                                                                                                                                            |
| S103       | Accepted    | Generated Switch. Actual generation installs the native Bits Root/Thumb and a single named native checkbox bridge, with truthful dependency/ownership metadata and initial SSR input state. It does not clone the primitive keyboard/state engine.                                                                                                                                                                                                                                                                     |
| S104       | Accepted    | Switch state and native forms. Production controls qualify state, pointer/keyboard/caller handlers, one field, required/disabled/value/form association, reset seeds and cancellation, actual refs, RTL travel, radius/theme/motion and teardown. Independent same-ID external form replacement initially failed and now resets both native field and bound Switch; current-owner capture and pending timer cleanup preserve the original criteria.                                                                    |
| S105       | Accepted    | Dialog family contract. Eight exact native compound public parts form one complete eleven-asset ownership cohort and sixteen flat exports. Contract candidates do not prematurely claim a partial shipped family.                                                                                                                                                                                                                                                                                                      |
| S106       | Accepted    | Dialog Root and Trigger. Actual candidate and installed compositions preserve native open binding, forwarded trigger props/ref and delegated snippets without independent identity or context state.                                                                                                                                                                                                                                                                                                                   |
| S107       | Accepted    | Dialog Portal and Overlay. Exact native target, disabled, ref and snippet contracts are retained for body/custom Element portals; lifecycle mounting remains upstream and no module-global instance state or second portal engine is introduced.                                                                                                                                                                                                                                                                       |
| S108       | Accepted    | Dialog Content. Content forwards native classes/attrs/ref/snippets and native focus, dismissal and presence behavior. The narrow physical-description guard does not duplicate the primitive interaction engine.                                                                                                                                                                                                                                                                                                       |
| S109       | Accepted    | Dialog Title, Description and Close. Actual native IDs, names/descriptions, ref/event/snippet forwarding and cancelable Close behavior remain intact. The independent supported ShadowRoot Element portal failure is repaired: lookup and mutation observation use Content actual tree, retain real IDs and remove only physically absent references.                                                                                                                                                                  |
| S110       | Accepted    | Dialog managed CSS. Every authored design class maps to an actual compound part. Production CSS qualifies token/fallback precedence, logical geometry/radius, focus/disabled styling, presence and reduced motion without broad global Bits selectors.                                                                                                                                                                                                                                                                 |
| S111       | Accepted    | Complete Dialog registry family. Actual default/custom CLI generation installs the complete eleven-asset family, flat exported aliases and all managed CSS with truthful single-cohort ownership; generated applications typecheck and build.                                                                                                                                                                                                                                                                          |
| S112       | Accepted    | Dialog interaction and presence. Real installed browser cases qualify modal keyboard focus/trap/return, dismissal and cancellation, names/descriptions, nesting, repeated and interrupted presence and ref/state forwarding. Pinned native opening-completion limitations are directly controlled, not hidden by a duplicate engine.                                                                                                                                                                                   |
| S113       | Accepted    | Portal theme scopes. Actual document and nested live custom-host theme inheritance is qualified without copied computed token values. Transformed/overflow-hidden native host geometry is demonstrated and documented rather than misrepresented as viewport-fixed behavior.                                                                                                                                                                                                                                           |
| S114       | Accepted    | Dialog SSR and hydration. Actual open/closed SSR, native request-local identity, distinct simultaneous instances, hydrated relationships/state and absence of errors are qualified. Native SSR description-registration timing is directly compared with raw Bits. Actual description removal/ref replacement/root destruction/remount and owned-observer teardown remain covered; tree-local repair adds shadow observer teardown.                                                                                    |
| S115       | Accepted    | Integrated installed and packed core. Actual built and offline tarball-installed CLI workflows generate tokens, Spinner, Button, Switch and complete Dialog in default/custom applications. Production check/build/SSR/Chromium, truthful safe synthetic upgrades, preserved local source/app CSS, whole-cohort conflict and exact complete-tree replay qualify the original integrated gate. Installed binaries and assets resolve explicit package dependencies without authoring source fallback or store mutation. |

## Independent findings and causal repair verification

The first frozen candidate failed two independent actual installed production
application probes. These were original native-preservation defects, not requests
for new public APIs.

Replacing Switch's external form with a new element of the same ID reset the
real checkbox to checked while leaving the bound Root unchecked. The original
reset listener was tied to a stale form element. The repair captures reset in
the input's tree and resolves `input.form` at event time, settling only after
cancellation is observable. The independent original probe rerun exits 0:
original and replacement forms both reset Root and field to true; the native
checkbox comparator does likewise. Maintained default/custom regressions also
qualify cancellation, unrelated resets and one field; prior causal negative
artifacts prove pending timer cleanup matters during teardown.

A supported native Element portal inside an open ShadowRoot contained a real
Description, yet the wrapper removed its valid `aria-describedby`; the raw Bits
control preserved the matching real ID. Document-only lookup caused the defect.
The guard now resolves and observes Content's actual Document or ShadowRoot.
The independent original probe rerun exits 0: both wrapper and raw native retain
exactly their physically connected Description ID, with no page errors. Maintained
production cases additionally rename/restore IDs, remove/reinsert the actual
Description and prove the one owned shadow observer disconnects after close.
Existing document description/ref replacement/root destruction controls remain.
No alternate context, identity, portal or focus engine was introduced.

Reviewer executions used green extbuild doctor and routed pinned Node 24.21.0
isolated installed-app check/build/Chromium probes. Both before runs failed the
causal assertions; both repaired reruns succeeded against exact committed
`5c235ee`. Raw independent probe outputs are retained in the private review
record. Public maintained causal evidence is
`tests/browser/switch.spec.ts`, `tests/browser/dialog-shadow.spec.ts`, the
installed generated-consumer helper and
`implementation/evidence/RCLD06_R1_REPAIR.md`. The reviewer independently recorded
203 source, built module, registry and schema file identities on the repaired
candidate; public product files were not changed by the reviewer.

## Verification and evidence provenance

Audited retained author cumulative evidence on preceding `c94ea07`:

- Full integration 725/725; Chromium 117/117; components 75/75, including strict
  17 diagnostic controls; registry 46/46.
- Actual packed core applications and inventory 3/3; authenticated planner,
  composition, validation and apply regressions 142/142.
- Maintained fixture check zero errors/warnings and build; typecheck, lint,
  formatting and contract/projection validation succeed.

Audited fresh repaired candidate owning evidence:

- Switch Chromium 18/18, Dialog hydration/teardown 15/15 and tree-local
  description/observer Chromium 2/2.
- Owning installed Switch/Dialog, actual SSR and core integration 11/11;
  registry 46/46; strict native component contracts 24/24.
- Actual packed core workflow and inventory 3/3; typecheck, lint, format and
  contract/projection checks exit 0.
- Subsequent entire repaired Chromium lane 121/121 passes in 3.9 minutes. The
  reviewer audited the actual command, fixture token projection/build and final
  121-case result in `implementation/evidence/logs/codex-r10/r6-repair-full-browser.log`.
  This is fresh author-owned whole-browser evidence on `5c235ee`, including the
  original 117 cases and four added form-owner/tree-local controls.

These counts are author-owned checks audited by the reviewer, not relabeled as
independent suite executions. The earlier full 725/117/75 lanes precede the two
narrow guard repairs. The current owning checks and independent causal reruns
qualify those changed paths; they are not described as a fresh whole integration
run. Raw author logs are retained under
`implementation/evidence/logs/codex-r10/s115-*` and `r6-repair-*`, with actual
consumer source/lock/CSS/type/route/handler identities, complete production file
hashes and check/build output under generated-consumer, dialog SSR, core workflow
and packed core evidence. Earlier failed setup/retargeting attempts are retained
and distinguished from the final passing physical-reference tests.

## Native boundaries and remaining requirements

Pinned Bits 2.19.3 omits the first newly portaled opening-completion notification
because its native tracker initially sees no Content ref; a raw native control
proves the same sequence. Completed close notification is forwarded. Initially
open inline SSR Content precedes native Title/Description registration; raw Bits
proves the same server boundary, while actual nodes and request-local IDs render
and native relationships become correct during hydration. Body/custom SSR portals
remain browser-only according to native semantics; application SSR was not
disabled. These are native guarantees, not waived hydrated identity, accessibility,
state, focus, dismissal, error or lifecycle obligations.

The shadow cases qualify supported Element portal physical-description relations
and observer lifetime. They do not claim additional shadow pointer/focus/CSS
capabilities beyond upstream; event retargeting in the initial interaction attempt
was retained rather than represented as a passing full-shadow-modal test. Actual
normal document/custom-host interaction criteria remain covered separately.

AC20 remains open for exactly two fixture-only upstream Bits TS2590 declaration
exceptions with strict controls and four ignored unchanged-reference tests. No
Windows, physical second-filesystem, remote CI, publication or deployment execution
is claimed. Later catalog, component, platform, final packaging/release and full
MVP S116–S203 obligations remain required. There is no new owner decision or
external/hardware blocker at this gate. The reviewer staged and committed nothing
and changed no product/test source, parent index or reference source.
