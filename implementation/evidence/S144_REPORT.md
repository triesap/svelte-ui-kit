# S144 step report — Qualify Collapsible disclosure composition

Author: Codex. Locally verified candidate; independent S148 acceptance pending.
Implementation commit will be recorded after the green commit.

Original R20, R21, R22, R29, R31, R32, R33, R34. Starting
`68577a42f1c210181060e9e347becb59a1f3ef05` on `master`.

Actual CLI-installed default/custom consumers qualify binding, native Space/Enter
and pointer activation, meaningful labels and current expanded/controls links,
callbacks/completion, caller cancellation, Root disabled refusal, attrs/classes,
actual refs and delegated snippets. Native button semantics never submit the
surrounding form. Closed content retains the actual input/value; forceMount
leaves closed DOM visible under the documented caller visual policy.

Two independent heading/trigger/content recipe items preserve six distinct
native IDs from actual server markup through hydration. Toggling either preserves
the other and the primary disclosure. Twelve concurrent requests per layout
alternate open/closed state without request leakage; both initial states hydrate
with zero callbacks/completions and correct native links. A direct raw Bits
control independently reproduces Trigger-before-Content SSR controls omission;
both installed and raw relationships are correct after native registration.

The caller example adds measured-height animations without modifying managed
styles or wrapper behavior. Actual exit animation is paused: closed-state content
remains visible with ending-style until the animation finishes, then native
presence hides it and completes once. Nine rapid toggles settle correctly without
losing input DOM. Reduced motion disables both animations. Destroying the Root
during exit clears all refs and prevents stale completion after the exit duration;
remount restores one functional disclosure without shared state or new engines.

Nonce-bearing CSP consumers measure both server and hydrated response paths.
Allowing attributes has zero diagnostics. Denying attributes records only exact
style-src-attr violations (six server/seven hydrated in this route), blocking SSR
measurement styles. Hydrated Chromium CSSOM property updates still establish
dimensions; source padding, visibility and keyboard toggles remain functional.
This is bounded evidence, not a zero-inline-style or arbitrary motion guarantee.
Every diagnostic is retained; exceptions, warnings and unrelated errors fail.

Initial behavior/style lane: 20/22 passed; both failures were the example's
reduced-motion rule losing specificity to animation state selectors. Match the
actual state selectors in the reduced-motion override. The initial lint also
required a stable key for the independent recipe each block; added its index key.
Fresh owning lanes pass; no product primitive repair, suppression or omitted case.

Verification through `cargo extbuild run --` after green doctor, Node24.21.0:

- `pnpm exec playwright test --config playwright.config.ts tests/browser/collapsible.spec.ts tests/browser/collapsible-styles.spec.ts tests/browser/collapsible-csp.spec.ts`: 30/30, exit0; 18 behavior, four styles and eight CSP cases.
- Final CSP lane with explicit nonzero expected-denial diagnostics: eight/eight, exit0.
- `node tools/run-unit-tests.mjs --suite components tests/components/collapsible-types.test.ts tests/components/collapsible-parts.test.ts tests/components/collapsible-css.test.ts`: 18/18, exit0.
- `pnpm run fixture:check`, `pnpm run fixture:build`: final exit0; zero errors/warnings and real adapter output.
- `pnpm run typecheck`, `pnpm run lint`, `pnpm run format:check`, `pnpm run check:contracts`: final exit0.
- Diff/staged review and checks pass; original 203 checkpoint definitions unchanged. Conditional Cargo N/A.

Files: installed route, owning behavior/CSP tests, measured worksheet, this report
and preceding S143 bookkeeping. Raw logs: `implementation/evidence/logs/s144-*.log`,
`logs/generated-consumer/` and per-case actual identities, HTML and geometry.
No remaining failure, blocker or scope deviation. Repository boundaries and
accepted criteria remain intact. Continue original S145 after the green commit;
separate S148 and full MVP acceptance remain open.
