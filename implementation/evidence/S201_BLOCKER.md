# S201 blocked qualification — raw upstream declaration checking

Status: BLOCKED qualification. No S201 implementation commit,
checkpoint acceptance, final release or AC20 waiver is claimed.

The owner approved the 2026-10-08 completion-review repair scope in
[the governing RCLD](../COMMIT_SEQUENCE.md). R11-F01–R11-F06 now specify strict
diagnosis/adoption, a conditional source-level native fix with reproducible local
delivery, no-change safety, full-suite CI, guidance and cumulative qualification.
All preceding policy selections are resolved; no compatible replacement or fix
is established by that approval. The raw failure below remains the actual
blocker. A source fix uses an isolated copy and authentic generated declarations;
the reference source and installed declarations/package stores remain unchanged.
S201/S202/S203 and separate final acceptance remain outstanding.

Last verified candidate commit: `c1a2b3321c64b8e39006e00e0abcc307222fcbf8`
(S200). Implemented candidates reach S200; independent acceptance reaches S193
at `8ab760dc4d674853b172126b2a3ec3a0434c678f`. S194–S200 are seven candidates
pending the mandatory separate final S203 gate. S201 cannot be committed green;
S202/S203 remain dependent and were not entered.

The first final strict prerequisite was executed in a fresh owned copy of the
maintained consumer with `skipLibCheck: false`. Its application dependencies
were explicitly installed with `pnpm install --ignore-scripts
--strict-peer-dependencies --engine-strict` (exit 0). Actual versions were
TypeScript 6.0.3, Svelte 5.57.1 and Bits UI 2.19.3, with the maintained checker
4.7.6 and date 3.12.4. The actual `pnpm run check` runs SvelteKit sync followed
by `svelte-check --tsconfig ./tsconfig.json --fail-on-warnings`. It exited 1
without a timeout or signal, reporting exactly two errors and zero warnings:

| Declaration owner                                            | Location          | Diagnostic                                  |
| ------------------------------------------------------------ | ----------------- | ------------------------------------------- |
| `bits-ui/dist/bits/button/components/button.svelte.d.ts`     | line 2, column 23 | TS2590: union type too complex to represent |
| `bits-ui/dist/bits/calendar/components/calendar.svelte.d.ts` | line 2, column 25 | TS2590: union type too complex to represent |

Raw complete command results and actual versions are retained in ignored
`implementation/evidence/logs/s201-strict-prerequisite/current.json` and
`s201-strict-prerequisite.log`. The probe propagates the failed checker status
as exit 1 and removes only its owned temporary consumer afterward. No shared
dependency declaration, repository manifest, lockfile or compatibility pin was
changed. The earlier [separate technical assessment](S196_STRICT_ASSESSMENT.md)
records the same declaration/compiler representability boundary across seven
failed supported probes; it accepts no final checkpoint.

Fresh registry metadata observations identify checker 4.7.6 as latest, with
TypeScript peer range `^5.0.0 || ^6.0.0`, and 6.0.3 as the latest 6.x compiler.
The available 7.0.2 compiler is outside that checker peer range and was not
installed as an unsupported replacement. Responses are retained as
`s201-checker-metadata.json`, `s201-typescript-metadata.json` and
`s201-typescript6-metadata.json` beneath the ignored log directory. No supported
green resolution is established; these observations do not rule out future
compatible upstream fixes.

S197–S200 completed their owning qualification: four installation/upgrade
workflow cases, 22 recovery cases, six production Chromium example cases and
three traceability cases, with no skips in the final runs. Their required root
typecheck/lint/full-format/contracts checks pass. S199's actual generated apps
and maintained fixture check/build pass. All 203 original definition slices,
95 immutable reference hashes, reference revision/clean state and the existing
repository boundaries remain preserved. Their reports retain failed attempts
and actual final results.

Those scoped checks and prior independently accepted cumulative runs are not a
fresh final S201 cumulative pass. The remaining full unit/integration/component/
registry/browser/package, contract regression, production package inspection
and applicable platform reruns have not been repeated at this blocked final
boundary. Cargo guards remain N/A. The blocker must first be resolved through a
genuinely compatible native declaration/compiler combination that passes raw
strict checking with zero errors/warnings and affected runtime/consumer checks.
Then execute every original S201 cumulative obligation, commit green, complete
S202/S203 and obtain mandatory separate final acceptance. Do not suppress types,
patch installed declarations, hide imports, disable SSR, accept the temporary
library-check exception as green, or bypass dependencies.
