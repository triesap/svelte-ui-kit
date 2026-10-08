# S196 independent strict-declaration blocker assessment

Separate reviewer assessment, 2026-10-08. This is a read-only diagnosis recorded as plain evidence at the author's request. It accepts no original S194–S196 checkpoint, final release or AC20 work. No product/test repair, dependency change, checker execution or authority transition was performed by the reviewer.

The inspected repository baseline is `2aeec283befbb9380a53898e2ad2b8874218f71b`, with S196 candidates in progress. Current selected pins are TypeScript 6.0.3, Svelte 5.57.1 and Bits UI 2.19.3. The maintained fixture's ordinary `skipLibCheck:true` result and the strict audit's qualified exception are not raw `skipLibCheck:false` green evidence.

## Actual retained probes

The reviewer inspected the following author-executed raw JSON records under implementation/evidence/logs/s196-strict-probes. Each records installation exit 0 followed by check exit 1, with exactly two native union-complexity errors and zero checker warnings. The exact-optional probe had completed when inspected. The reviewer did not rerun these commands or claim independent execution.

| Record              | Actual selected variant                           | Strict result              |
| ------------------- | ------------------------------------------------- | -------------------------- |
| current.json        | TypeScript 6.0.3 / Svelte 5.57.1 / Bits 2.19.3    | check 1; two TS2590 errors |
| ts59.json           | TypeScript 5.9.3; otherwise current               | check 1; two TS2590 errors |
| ts58.json           | TypeScript 5.8.3; otherwise current               | check 1; two TS2590 errors |
| bitsPatch.json      | Bits 2.19.5; otherwise current                    | check 1; two TS2590 errors |
| producerSvelte.json | Svelte 5.46.4 / TypeScript 6.0.3 / Bits 2.19.3    | check 1; two TS2590 errors |
| producerPair.json   | Svelte 5.46.4 / TypeScript 5.9.3 / Bits 2.19.3    | check 1; two TS2590 errors |
| exactOptional.json  | Current pins with exactOptionalPropertyTypes:true | check 1; two TS2590 errors |

Every record identifies the same installed native declaration owners: bits-ui/dist/bits/button/components/button.svelte.d.ts, line 2, and bits-ui/dist/bits/calendar/components/calendar.svelte.d.ts, line 2. The diagnostic is TS2590, “Expression produces a union type that is too complex to represent.” These are dependency declaration failures, not diagnostics in authored kit wrappers.

## Inspected installed sources and boundary

The actual installed packages were resolved from tests/fixtures/consumer/node_modules, including their package-manager physical targets. Inspected package-relative paths were:

- bits-ui/package.json and bits-ui/dist/index.d.ts;
- bits-ui/dist/bits/button/components/button.svelte.d.ts and bits-ui/dist/bits/button/types.d.ts;
- bits-ui/dist/bits/calendar/components/calendar.svelte.d.ts and bits-ui/dist/bits/calendar/types.d.ts;
- bits-ui/dist/internal/types.d.ts and bits-ui/dist/shared/index.d.ts;
- svelte/types/index.d.ts and svelte/elements.d.ts;
- typescript/lib/_tsc.js;
- tests/helpers/strict-audit.ts, tests/components/strict-declaration.test.ts and tests/fixtures/consumer/tsconfig.json.

Bits declares Button as Svelte.Component<ButtonRootProps, {}, "ref"> and Calendar as Svelte.Component<CalendarRootProps, {}, "ref" | "value" | "placeholder">. ButtonRootProps combines native anchor/button alternatives; CalendarRootProps combines single/multiple value alternatives, snippet/child contracts and native attributes. Svelte's Component generic constrains Bindings by keyof Props and includes the component call and typed properties. These actual definitions establish the dependency type interaction involved; without a compiler trace, this assessment does not attribute either error to one particular Cartesian-product expansion.

Bits 2.19.3 package exports advertise only the public root entry, whose types target is dist/index.d.ts. That declaration exports the native Button and Calendar families along with the other families. A deep internal declaration/import detour is not an advertised supported subpath solution. Hiding those owners through import redirection would also fail the requested strict boundary.

The inspected TypeScript 6.0.3 _tsc.js contains two explicit TS2590 limit sites. checkCrossProductUnion computes the product of union constituent counts and emits TS2590 at size >= 100,000. removeSubtypes tests at 100,000 comparisons and emits TS2590 when its estimated total exceeds 1,000,000. These checks use hard-coded thresholds, not a configurable union budget. The disableSizeLimit option does not bypass those inspected checks. Increasing heap or changing that option therefore is not an established resolution.

The existing strict audit pins actual versions, parses complete machine output and rejects additional diagnostics, wrong owners, changed pins and tool failures. Its causal authored Svelte/TypeScript/declaration/additional-dependency controls establish a bounded, fail-closed exception. They do not turn the two native errors into raw strict-green acceptance.

## Remaining qualification

No minimal supported green solution is demonstrated by the inspected baseline or seven recorded variants. The current release blocker is native declaration/compiler representability under full strict declaration checking. The original criteria remain unchanged.

A genuine resolution could be a released upstream declaration or compiler fix, or another compatible dependency combination that actually passes. Future versions are not ruled out. Any candidate must first have verified peer/engine/tool support and a real skipLibCheck:false check with zero errors and warnings, using the supported public entry and unchanged native contracts. It then requires affected declaration, consumer, package, SSR/hydration and runtime compatibility qualification before the selected pins or final acceptance can change.

Declaration patching, any/suppressions, skipLibCheck, weakened checks, SSR disabling and hidden import redirection do not satisfy this assessment's requested boundary. No replacement version is accepted here, and no original checkpoint or final AC20 obligation is waived.
