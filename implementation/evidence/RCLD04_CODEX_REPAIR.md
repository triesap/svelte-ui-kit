# RCLD-04 Codex repairs after a176387

Implemented repairs to the original authority, lexical rendering and recoverable
transaction requirements. Independent S077 acceptance is pending. This is factual
implementation evidence, not a replacement plan or acceptance record.

The original 203 checkpoint definitions are byte-identical to `a176387`.
Previously accepted S001–S063 and R9 source-binding/customization controls remain.

## Authority and rendering

Loader-created registry snapshots and deeply frozen registry-derived export
relationships have private identity receipts. The original conflict-free planner
records the captured snapshot, complete operation digest, final semantic lock
and publication bytes. Composition requires that receipt unconditionally;
zero-item initialization cannot bypass it. Sync revokes its internal Add receipt
and registers only an executable final outcome. A satisfied planner permits only
captured canonical bytes. A second private receipt binds the complete composed
apply value, including operations and physical/environment readset. Validation
rejects altered or omitted authority before sealing; applying arbitrary shaped
or copied authority remains forbidden.

Lexical child proof follows ObjectPattern properties, nested/rest patterns,
each indices, branch-specific await/each scopes, fragment const declarations
and declaration-site snippet closures. Deferred component children, component
let bindings and named legacy slots cannot prove default page rendering.
Positive aliases, invoked wrappers, closures, fallback branches, direct default
legacy slots and unrelated component siblings retain coverage.

Maintained causal controls are in `review17-authority.test.ts`,
`semantic-authority.test.ts`, `compose-authority.test.ts`,
`transaction-authority.test.ts` and `svelte-layout-parse.test.ts`.

## Recovery repairs exposed by authentic fixtures

Positive guarded-apply fixtures now use real snapshot/registry/planner/composer
calls rather than constructing synthetic executable authority. Malformed raw
projection fixtures remain negative validation controls only. This migration
exposed two genuine failures: outer ancestry cleanup invalidated retained partial
restore proof, and a cleanup interruption after directory removal prevented a
fresh recovery retry.

A failed restore preserves recorded ancestry and journal evidence. Completed
restoration durably records `rolled_back` before target directory removal. Its
retry has cleanup authority only after every semantic preimage, root/mapping,
retained stage/backup and publication witness is proven. Missing or wrong witness,
changed staged publication bytes/mode/inode, unrelated canonical appearance,
post-rollback user edits and forged published state refuse and preserve evidence.
Original coordination ancestry is recorded alongside target ancestry and removed
only after writer release through exact identity and empty-directory proof.
Private recovery-result lookup capabilities cannot mint cleanup ownership.

Maintained recovery tests include `owned-ancestry.test.ts`,
`review16-repairs.test.ts` and the ten `terminal-rollback.test.ts` controls.
The actual multi-item/lifecycle and six resulting-consumer scenarios remain
separate add/update/retirement/conflict and rendered output qualification; the
migrated initialization fixtures alone are not evidence for those dispositions.

## Verification and limits

Fresh routed checks: engine-strict frozen install, build, typecheck, lint,
format, projection generation and contract validation; unit 293/293; full
integration 553/553 plus the subsequently added owned-removal flush regression
in the focused owned-ancestry suite (5/5); registry 38/38; CLI bootstrap 52/52;
harness 37/37; components 22/22 including strict-declaration 17/17; contracts
137/137; consumer check 0 errors/0 warnings, consumer build/SSR 27/27 including
all six actual default/custom add/update/retirement scenarios; Chromium browser
23/23. Checksum-qualified actionlint 1.7.12 passes the CI workflow; archive SHA256
`aba9ced2dee8d27fecca3dc7feb1a7f9a52caefa1eb46f3271ea66b6e0e6953f` and the
executed binary match. Execution: Node24.21.0, pnpm11.22.0, macOS arm64.
The unchanged-reference fmt/check/test guard passes at
`a10fbf06334f4648f5755e05a7147414e4e5fc98`: 578 passed, 0 failed, 4 ignored.
Those four ignored cases remain explicit AC20 debt; they are not reported passed.

Ignored raw logs: `implementation/evidence/logs/codex-r10/`.
No Windows or physical cross-device execution, remote CI, publication or release
acceptance is claimed. AC20 upstream exceptions remain open under original terms.
