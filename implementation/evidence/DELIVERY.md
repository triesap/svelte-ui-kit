# Original MVP delivery

Author: Codex. Updated 2026-10-09. Original implementation and separate RCLD-11
acceptance are complete within the documented local scope. The sole execution/status authority is the
[governing ledger](../COMMIT_SEQUENCE.md). No publication, push or deployment
is performed or required for this local delivery.

## Implementation and acceptance

S001–S193 and RCLD-01–RCLD-10 remain independently accepted at their recorded
anchors. S194–S203 and all approved repairs passed [separate final review](RCLD-11_QUALIFICATION.md)
on `b174b5ae8ffd4eead61df5e846ea4d39ac14ec74`, anchored at
`f756d227b6a1dce1396183dec4db138a256e16bf`. All 203 original checkpoints are implemented and independently
accepted; all eleven sequences are complete. The original implementation hashes
below remain provenance; conventional completion records use the review anchor.
S203 delivery is committed at `96fee1012e61fa57ad02faa7025de89e85937d0d`.
The complete repaired cumulative lane passes on source
`7756b5cbb53d5be7f6c25622e57da78edb283f51`. Subsequent changes concern execution
evidence, extension scope, linked fixture inputs, the independently accepted
contract-fixture lifecycle correction and current documentation, with
affected checks rerun rather than old runs relabeled fresh.

| Original checkpoint | Verified implementation commit             | Conventional report |
| ------------------- | ------------------------------------------ | ------------------- |
| S194                | `69dfeca0cd6788ebc5d739f171c5b56bb9f19cf2` | `S194_REPORT.md`    |
| S195                | `2aeec283befbb9380a53898e2ad2b8874218f71b` | `S195_REPORT.md`    |
| S196                | `d9f3d733cadbc11bb3e9110a8f0e72a7ebb158c6` | `S196_REPORT.md`    |
| S197                | `5b28f4b1738970722b77bde79a95d9e7c02f6928` | `S197_REPORT.md`    |
| S198                | `918b503d3c18ecac64fc1943b2d632bf865aaa75` | `S198_REPORT.md`    |
| S199                | `a097624bf8ddba93fa824b9543054e49588f6bb1` | `S199_REPORT.md`    |
| S200                | `c1a2b3321c64b8e39006e00e0abcc307222fcbf8` | `S200_REPORT.md`    |
| S201                | `5ee6a2d89057396e0041695b7d0a18dd306285bc` | `S201_REPORT.md`    |
| S202                | `01ec4d1e02bdc7361f1e74025c54e4351ca4db53` | `S202_REPORT.md`    |
| S203                | `96fee1012e61fa57ad02faa7025de89e85937d0d` | `S203_REPORT.md`    |

[The repair report](RCLD-11_REPAIR_REPORT.md) retains the source/emitter diagnosis,
genuine producer and portable `.2` adoption, application-owned local delivery,
no-change recovery refusal, complete isolated CI coverage, current guidance and
cumulative qualification, including failures and their actual corrected runs.
The separate reviewer accepted these repairs against all original S194–S203
criteria and the completion amendment. No implementation self-review supplied
acceptance.

## Delivered product and qualified checks

The package exposes one TypeScript CLI with bundled 22-item registry and v1
schemas. Generated Svelte/TS/plain CSS and native dependency belong to the
application; there is no styled kit runtime, remote registry, automatic install
or force/merge behavior. Explicit roots and resolved closure, physical path
safety, source/style/export cohorts, truthful customization baselines,
retirement/warnings, pure replay and lock-last recoverable transactions are
qualified in actual generated and source-independent installed consumers.
Unchanged init/add/sync refuse busy, pending or corrupt recovery state without
acquiring a writer, cleaning evidence or changing complete project trees.

[Final verification](FINAL_VERIFICATION.md) contains actual commands/durations,
source/log inventories and current artifact identities. Full unit 298,
integration 895, registry 66, components 441, package 10, Chromium 733, consumer
SSR 27, harness 39, CLI 44, CI controls 20, contracts 159 and native producer/
delivery 5 cases pass. Fresh Linux safety/recovery 172 cases pass as uid/gid
65534; the same 17 files pass in the current complete macOS integration lane.
All report zero failures/skips/cancellations/TODOs; Chromium has zero retries.
Raw `skipLibCheck: false` consumer checking has zero errors/warnings; full
format/lint, six root types, production builds, frozen strict installation,
semantic CI coverage and actual local packing pass. Conditional Rust guards
are N/A for this TypeScript-only target. Original 203 definitions, 95 immutable
source hashes and clean reference identities remain exact.

R01–R34 and AC01–AC22 retain their [complete evidence map](../TRACEABILITY.md).
AC01–AC13 have actual installed/ownership/protocol/recovery controls; AC14–AC19
have complete catalog, raw native type, generated-browser, SSR and computed CSS/
portal/CSP evidence within recorded boundaries. AC20's full lane passes without the former strict exception and is separately
accepted. AC21 has the separate final review and real reachable report/review
anchors. AC22 is separately accepted through [the S202 extension gate](../EXTENSION_GATE.md),
not unspecified extension components.

## Artifact reproduction and compatibility

The retained full-lane private `svelte-ui-kit@0.1.0` archive is
`logs/r11-f06-packed/svelte-ui-kit-0.1.0.tgz`, SHA-256
`cfe7ae7bc174e04a866f738e80e8b9265653881d4d07936e63ef7904375315f0`.
It contains 241 permitted regular files; full inventory is
`logs/r11-f06-artifact-inventory.json`. Current documentation affects packed
README bytes. The fresh S203 archive is
`logs/s203-packed/svelte-ui-kit-0.1.0.tgz`, SHA-256
`614e53da9c64a4be1013a36e1d222497199660166ce460bacb32b2c643cf3d5a`;
`logs/s203-artifact-inventory.json` records all 241 files. Actual complete
comparison with the full-lane artifact shows only README changes; the other
240 files and all modes remain exact, including runtime/native bytes.
`logs/s203-artifact-delta.json` retains that proof. CLI executable SHA-256 is
`fdf252d47a0771ced9f9fb4ff942e1ae1413217742903bc60f56113fc0aa064a`.
The bundled authentic native archive SHA-256 remains
`1384075b9d764f80b92a94e378f233c2382dd6125fb3c301ae46be6d7746e603`.

The [command map](COMMANDS.md), [developer bootstrap](../../CONTRIBUTING.md),
[application-owned native setup](../../README.md#application-owned-native-dependency)
and [producer recipe](../../tools/native-dependency/README.md) provide actual
reproduction commands. Prepare authentic root/fixture native archives before
frozen strict installation, build the CLI, run required suites serially and pack
locally. Applications explicitly extract/authenticate the bundled native member
into their own local-file dependency before installation; that copy survives
loss of the authoring tree and CLI host. Archives/generated output remain local
inspection artifacts, not committed binaries or assumed published releases.

[Compatibility](COMPATIBILITY.md#current-native-and-source-boundaries),
[accessibility](ACCESSIBILITY.md) and [platform evidence](PLATFORMS.md#current-repaired-candidate)
bound qualification: Node 24.21.0 / pnpm 11.22.0; selected Svelte 5.57.1,
Bits 2.19.5-svelte-ui-kit.2, date 3.12.4, TypeScript 6.0.3, checker 4.7.6,
Kit 2.70.3 and Vite 8.3.1; Chromium on macOS and supported trusted-local
macOS/Linux filesystem operations. Native reset cancellation, force-mounted
locking, callback completion, SSR relation registration, floating IDs, CSP and
nested clipping observations remain explicit. Radio/Switch nontext contrast
concerns retain source provenance and have the explicit independent AC18
required-issue disposition in the final qualification; they are not certified
as 3:1 or universal WCAG compliance. Windows/hostile races, remote filesystems/power loss, Firefox/WebKit,
Linux browser rendering, arbitrary themes and screen-reader speech remain
unsupported or unqualified. Configured CI jobs have complete source-owned
coverage and measured local lanes; hosted runs are not claimed.

## Completed original scope and extension boundary

All original checkpoints and repairs passed separate acceptance. The final
ledger/projection/conventional records use the real review-evidence anchor;
final changed-document closure is recorded separately below. No push,
publication, deployment or reference mutation is included.

The complete unfinished original RCLD set is **none**. Select/Combobox/Popover/
date/higher-level implementation requires its own finite approved product
contracts and future sequence. It is outside this completed original MVP.

## Final changed-scope execution

S203's actual final-document lanes pass: full format/lint, six TypeScript
configs, CI coverage, live contracts, real linked-guidance fixture 1/1,
traceability 3/3, package inventory/metadata 2/2 and actual local pack/audit.
The complete contract regression is freshly rerun against the new real
document inputs: 159/159, zero skips/failures/cancellations/TODOs, 634982 ms.
`logs/s203-{final,contract}-outcome.json` retains exact commands, durations,
statuses and raw log digests; `logs/s203-source-freeze.json` confirms all 1207
tracked inputs remain exact through both runs. Final result/status annotations
are checked afterward without relabeling the unchanged full product runs.

## Final accepted-state closure

Actual final accepted-state verification passed full formatting/lint, all six
root TypeScript configurations, CI coverage, live contracts, linked guidance 1/1,
registry traceability 3/3, package inventory/metadata 2/2, local packing/audit,
source/reference/index preservation and diff checks. Full contract regression
passed **160/160** in **662034 ms**, with zero failures, skips,
cancellations or TODOs. All **1218** tracked inputs remained byte-exact through
these fourteen lanes; `logs/r11-final-repaired-qualified-freeze.json` authenticates
the source inventory, actual command statuses and every raw log digest before
status/result annotations. Execution used Node 24.21.0 and pnpm 11.22.0 in the
accepted-state working tree over `f756d227b6a1dce1396183dec4db138a256e16bf`.

The actual final archive is `logs/r11-final-repaired-packed/svelte-ui-kit-0.1.0.tgz`,
SHA-256 `e22152dee9856cba50e6846cb14539f6e668a672438583695a84b4f0a0332dd7`. It contains **241** permitted regular files.
Comparison with the full product-qualified artifact changes only README; the
other **240** files and all modes, executable and native archive identities remain
exact. `logs/r11-final-repaired-artifact-inventory.json` and
`logs/r11-final-repaired-artifact-delta.json` retain that proof. Owned audit staging
was removed; prior artifacts/logs remain retained. README and every package input
remain unchanged by subsequent status/result annotations.

Full product executions remain attributed to `7756b5cbb53d5be7f6c25622e57da78edb283f51`,
and the separate reviewer execution to `b174b5ae8ffd4eead61df5e846ea4d39ac14ec74`. Final
component-map header annotations reconcile the same actual separate acceptance;
technical contracts and historical bodies are preserved. These status/result
annotations require focused formatting, live-contract, linked-guidance and
preservation checks before the final commit; they do not relabel earlier runs.

The first accepted-state full regression failed 157/159 (two failures, zero
skips) in 704989 ms. Both historical no-batch tests depended on an inherited
authoring batch marker. Fixture construction now strips all copied authority and
generates only scenario-owned authorization; both tests explicitly create their
owned record before preserving the strict removal assertion. A new causal case
covers eight absent/foreign/malformed/duplicate combinations across no-batch and
pending scenarios, with real CLI and complete-tree read-only assertions. Root
focused checks passed 3/3; the separate reviewer independently accepted the
correction after 8/8 checks. The
failed raw run remains at `logs/r11-final-contract-regression.log` and
`logs/r11-final-outcome.json`; the corrected full 160-case run above
supplies final closure. Product/native code and required criteria are unchanged.

The private bookkeeping preparation initially refused a duplicated current
traceability phrase before writing any public file. Its observed exit-1 outcome
is retained in `logs/r11-finalize-first-outcome.json`; the corrected
preparation succeeded without changing product code, tests or requirements.
The complete unfinished original RCLD set is **none**.
