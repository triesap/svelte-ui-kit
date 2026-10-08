# S141 step report — Source-scoped Collapsible presence contract

Author: Codex. Locally verified candidate; independent S148 acceptance pending.
Implementation commit will be recorded after the green commit.

Original R03, R20, R22, R26, R32, R33, R34. Starting
`7c057486fcb6177956464969e65606bf1061cfb9` on `master`.

Read immutable source Root/Trigger/Content, manifest/CSS and actual pinned
Bits2.19.3 types/components/state. Freeze exactly three value/type pairs, five
source files plus one CSS asset in a complete cohort, tokens/pinned Bits only.
Source default_open/content_id map to native initial open/Content id. Native
identity/context replaces source framework ABI without another global counter,
keyboard engine or generalized Accordion API.

Root/Trigger alias exact native types. Content uses native props with the
source-unjustified hiddenUntilFound browser-search expansion excluded explicitly
and causally rejected. Native default false agrees with this source policy even
though its type comment says true. forceMount remains supported native presence
control for caller-composed motion. No broad native types are widened.

Boolean controlled/uncontrolled open, actual refs, state/completion callbacks,
disabled, native attrs/events/cancellation/classes/style and both rendering hooks
are frozen. All children are no-argument snippets; Content child additionally
receives native open with props. Native always-rendered content hides after
presence when closed; forceMount leaves closed content available for caller
visual policy. Native measurement dimensions and temporary inline styles remain
explicit, with actual motion/cleanup/SSR/hydration/CSP observations required in
later steps. Accordion-like behavior stays an application composition recipe.

Verification through `cargo extbuild run --` after green doctor, Node24.21.0:

- `node tools/run-unit-tests.mjs --suite components tests/components/collapsible-types.test.ts`: 16/16, exit0; one complete native positive controlled/uncontrolled fixture and 15 causal invalid fixtures, no library diagnostic suppression.
- `pnpm run fixture:check`: exit0; maintained consumer zero errors/warnings.
- `pnpm run typecheck`, `pnpm run lint`, `pnpm run format:check`, `pnpm run check:contracts`: exit0.
- `git diff --check`, staged diff review/check: exit0; conditional Cargo N/A.

Files: frozen native aliases/scoped Content type, source/native policy worksheet,
owning type fixtures, this report and preceding S140 bookkeeping. Logs:
`implementation/evidence/logs/s141-*.log`. No failure, skip, ignored issue,
blocker or scope deviation. Build/package/browser obligations start with actual
S142 candidates; the unadvertised type freeze does not certify those future
behaviors. Original 203 definitions and prior accepted evidence remain intact.
Continue original S142 wrappers after the green commit. Separate S148 acceptance
and full MVP acceptance remain open.
