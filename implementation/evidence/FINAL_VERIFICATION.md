# Final cumulative verification — S201 / R11-F06

Author: Codex. Verified implementation candidate; separate RCLD-11 acceptance
remains mandatory. Execution date: 2026-10-09. The unchanged source candidate
is `7756b5cbb53d5be7f6c25622e57da78edb283f51`; all 1202 tracked source files were inventoried
before the lanes and verified unchanged after them. Subsequent documentation
and status commits do not relabel these executions as fresh runs.

## Actual cumulative lanes

All commands below completed with status 0, no signal and no spawn error. Test
lanes report zero failures, skips, cancellations and TODOs; Chromium has zero
retries. Builds and checks are routed through the configured build runner, with
Node 24.21.0 and pnpm 11.22.0. Native preparation precedes frozen, strict-peer,
engine-strict installation. Shared source/consumer/compiler writers run serially.

| Actual command                                                                                                     | Result               | Duration   |
| ------------------------------------------------------------------------------------------------------------------ | -------------------- | ---------- |
| `node tools/prepare-native-dependency.mjs --fixture`                                                               | exit 0               | 39 ms      |
| `pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict`                                        | exit 0               | 461 ms     |
| `pnpm run format:check`                                                                                            | exit 0               | 9111 ms    |
| `pnpm run lint`                                                                                                    | exit 0               | 6137 ms    |
| `pnpm run typecheck`                                                                                               | six configs; exit 0  | 10000 ms   |
| `pnpm run check:ci`                                                                                                | exit 0               | 318 ms     |
| `pnpm run test:ci`                                                                                                 | 20/20                | 662 ms     |
| `pnpm run test:unit`                                                                                               | 298/298              | 29228 ms   |
| `pnpm run test:harness`                                                                                            | 39/39                | 66836 ms   |
| `pnpm run test:cli-bootstrap`                                                                                      | 44/44                | 13713 ms   |
| `pnpm run check:contracts`                                                                                         | zero errors/warnings | 6208 ms    |
| `pnpm run test:integration`                                                                                        | 895/895              | 2412336 ms |
| `pnpm run test:registry`                                                                                           | 66/66                | 74972 ms   |
| `pnpm run test:components`                                                                                         | 441/441              | 415911 ms  |
| `pnpm run test:package`                                                                                            | 10/10                | 433157 ms  |
| `pnpm run fixture:check`                                                                                           | zero errors/warnings | 3385 ms    |
| `pnpm run fixture:build`                                                                                           | exit 0               | 3817 ms    |
| `pnpm run test:fixture`                                                                                            | 27/27                | 56429 ms   |
| `pnpm run build`                                                                                                   | exit 0               | 1886 ms    |
| `pnpm pack --json --pack-destination implementation/evidence/logs/r11-f06-packed`                                  | exit 0               | 322 ms     |
| `node --test --test-concurrency=1 tools/build-native-dependency.test.mjs tools/prepare-native-dependency.test.mjs` | 5/5                  | 128600 ms  |
| `pnpm run test:contracts`                                                                                          | 159/159              | 840267 ms  |
| Full isolated `pnpm run test:browser`                                                                              | 733/733              | 2347813 ms |
| Fresh Linux 17-file filesystem/recovery replay                                                                     | 172/172              | 307209 ms  |

The browser lane uses an owned physical copy of the exact tracked source,
authentic native archive, fresh frozen dependency installation and actual CLI
build, then the full configured Chromium suite with one worker and strict
page/console/hydration/teardown collection. Its 1202 source hashes remain exact;
owned temporary staging was removed after retaining logs and output artifacts.
This qualifies all 22 items in actual default/custom and packaged applications,
native controls, forms, keyboard/focus, CSS/themes/RTL/motion, SSR/hydration,
callbacks, portal teardown, composition, customization and source independence.

Linux uses immutable image
`sha256:3d27e5c11e5786e309ec3e03f93ae536eb36e6e5eb3714d5eb3300a36157add0`, read-only input/tool mounts and a
container-owned case-sensitive application tree. Actual tests run as uid/gid
65534; permission-denial controls require real EACCES. The source archive is
`f280ebe938fa8ec227f4cc952fd1fe071d293d83ef375c6636867e7addf27902`. All 17 owning files also pass in
the current complete macOS integration lane. Containers use automatic removal.
This is local platform evidence, not hosted CI or Linux browser qualification.

## Real packed artifact and native dependency

Actual local `pnpm pack --json` output is
`implementation/evidence/logs/r11-f06-packed/svelte-ui-kit-0.1.0.tgz`, SHA-256
`cfe7ae7bc174e04a866f738e80e8b9265653881d4d07936e63ef7904375315f0`. The inspected archive has
241 regular files and 241 entries, with no duplicate,
traversal or symbolic-link entries. Only declared dist/registry/schema/package
metadata, notices, licenses and public guidance ship. Dist/registry/schema bytes
match the qualified source/build. The CLI executable SHA-256 is
`fdf252d47a0771ced9f9fb4ff942e1ae1413217742903bc60f56113fc0aa064a`.

The private `svelte-ui-kit@0.1.0` package exposes one executable; CLI runtime
dependencies remain ajv, semver, Svelte and TypeScript. It ships the authentic
`bits-ui@2.19.5-svelte-ui-kit.2` archive, SHA-256
`1384075b9d764f80b92a94e378f233c2382dd6125fb3c301ae46be6d7746e603`, generated using the recorded
minimal emitter source patch and original native runtime source. Provenance,
licenses and emitted file inventory are authenticated. The producer/control
lane rebuilds genuine source and checks strict public contracts and causal
negative controls. The application-owned local-file dependency is explicit;
actual standalone installed consumers keep working after author/CLI-host removal.
No registry release, publication or automatic application install is assumed.

Raw `skipLibCheck: false` consumer checking reports zero errors and warnings.
All six root configs and 18 declaration controls pass. Historical upstream
TS2590 failure is preserved in [the original blocker](S201_BLOCKER.md); its
former qualified exception is not used to certify the repaired candidate.

## Failures, scope and code health

The first isolated-browser setup copied another workspace's dependency metadata;
pnpm correctly refused its noninteractive replacement before any browser test.
The failed status/log/source snapshot remains in `logs/r11-f06-browser-replay/`.
The setup was corrected with a real fresh frozen installation in the owned
source copy. `logs/r11-f06-browser-replay-final/` records the actual successful
complete rerun. No production guard, type, test assertion or SSR policy changed
to repair this setup. Earlier F02/F03/F04 failures and their qualified repairs
remain in [the amendment repair report](RCLD-11_REPAIR_REPORT.md).

Inspection of the scoped CLI/project/registry/codegen boundaries found no
demonstrably obsolete step-scoped scaffold to remove. No broad cleanup/refactor
is introduced. No Cargo manifest/lock or affected Rust workspace exists in this
TypeScript-only target, so conditional Rust guards are N/A, not fresh passes.
All 203 original definition slices, all 95 immutable design-source hashes and
clean reference revisions remain exact. Repository/index boundaries are
preserved; no unrelated source, generated build output or secrets are staged.

[Current native/source boundaries](COMPATIBILITY.md#current-native-and-source-boundaries)
retain reset cancellation, force-mount pointer locking, first-open callback,
SSR relation registration, semantic versus floating IDs, CSP and nested clipping
observations. Radio/Switch nontext contrast concerns remain documented under
AC18; the separate reviewer must assess required-issue dispositions. Chromium
on macOS, supported macOS/Linux trusted-local filesystem operations and the
recorded Node/toolchain are qualified. Windows, hostile races, remote/NFS or
power-loss guarantees, Firefox/WebKit, screen-reader speech, arbitrary themes
and Linux browser rendering remain unqualified or unsupported as documented.

## Evidence and next dependency

Exact command arrays, statuses, durations, full source inventories and log
digests are retained in `logs/r11-f06-{foundation,root,contract}-outcome.json`.
Browser, Linux and artifact records are respectively
`logs/r11-f06-browser-replay-final/outcome.json`,
`logs/r11-f06-linux-replay/outcome.json` and
`logs/r11-f06-artifact-inventory.json`.
`logs/r11-f06-qualified-freeze.json` authenticates their retained inputs and
raw logs before documentation edits. The current preservation result is
`logs/r11-f06-preservation-result.json`. Original acceptance history remains
unchanged. After this green S201 implementation commit, original S202 extension
reconciliation and S203 delivery may proceed under the approved batch. Only
separate final review can accept S194–S203 and close RCLD-11.

## S203 changed-document qualification

After verified S201 and S202 commits, final public guidance, traceability and
real fixture inputs were updated without changing product/runtime source.
Actual full format/lint/six types, CI coverage, live contracts, linked-guidance
fixture 1/1, traceability 3/3 and package inventory/metadata 2/2 pass. Full
contract regression freshly passes 159/159 in 634982 ms, with zero skips,
failures, cancellations or TODOs. The 1207-file current input inventory remains
exact through both drivers; `logs/s203-source-freeze.json` authenticates those
outcomes and their raw log hashes before final result annotations.

Current S203 local packing yields
`logs/s203-packed/svelte-ui-kit-0.1.0.tgz`, SHA-256
`614e53da9c64a4be1013a36e1d222497199660166ce460bacb32b2c643cf3d5a`.
The actual 241-file comparison changes only README; 240 files and all modes,
including executable/native bytes, remain identical to the full-lane archive.
Inventory, comparison and raw commands are retained in
`logs/s203-artifact-inventory.json`, `logs/s203-artifact-delta.json` and
`logs/s203-{final,contract}-outcome.json`. Subsequent final status/result notes
receive live contract/guidance checks; the complete product executions above
retain their actual 7756b5c provenance rather than becoming new runs.
