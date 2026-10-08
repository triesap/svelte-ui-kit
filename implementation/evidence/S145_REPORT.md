# S145 step report — Freeze Field label, helper, and error composition

Author: Codex. Locally verified candidate; independent S148 acceptance pending.
Implementation commit will be recorded after the green commit.

Original R03, R20, R22, R28, R32, R33, R34. Starting
`3bdae0d2082440381ceb81b67dff42f8c8b30daa` on `master`.

Inspected all source Field parts at the immutable source revision. Worksheet maps
every fourteen-source export, including TextInput/TextInputType, TextArea,
NativeSelect, SelectIcon and all three convenience fields. Twelve native Svelte
components, internal context/types/index and one source CSS asset will constitute
the complete cohort. FieldSlot becomes a native Snippet type; TextInputType is
exactly the six source text types. Only tokens is a registry dependency. No form
store, schema library, new select/combobox API, Bits dependency or identity shim.

Freeze exact native input/textarea/select attrs/events/refs and string value
bindings, optional defaultValue where native binding supports it, source rows4,
single-select option children, native required/disabled/readonly/form semantics
and invalid presentation. Convenience label/name and SelectField selectedLabel
are required; source part classes and optional labelAction/icon map to ordinary
native snippet props. Root children expose current control/description/state
relationships, also accepting ordinary no-argument snippets.

Record the Svelte message ownership decision before implementation: Root owns
keyed native paragraph descriptors and derives rendered targets and described-by
from the same current list. This preserves source dynamic-message behavior while
avoiding a render-order-dependent server registration promise. Explicit controlId
supports kit controls; manual paragraph/native aria relationships remain caller
owned. Stable request-safe identity uses native $props.id(), with no global ID
counter or browser-only registration. Source required marker and icon remain
decorative; error styling does not invent automatic validation/live-region roles.
Original S146–S148 still must implement and measure these promises.

Strict compiler tests cover every mapped type/native event target, refs, snippets,
messages and convenience fields plus 21 causal negative cases. Initial 21/22
exposed an invalid harness assumption: TypeScript structurally permits an input
as a div ref because both expose the required div members. Replaced that negative
fixture with an actually foreign SVG ref; preserve native types without invented
branding. Final 22/22 passes with skipLibCheck=false and no ignored diagnostics.

Verification through `cargo extbuild run --` after green doctor, Node24.21.0:

- `node tools/run-unit-tests.mjs --suite components tests/components/field-types.test.ts`: final 22/22, exit0.
- `pnpm run fixture:check`: exit0; zero errors/warnings and exact token projections.
- `pnpm run typecheck`, `pnpm run lint`, `pnpm run format:check`, `pnpm run check:contracts`: exit0.
- Diff/staged review and checks pass; all original 203 checkpoint definitions unchanged. Reference identity/clean state preserved. Conditional Cargo N/A.

Files: native field types, full source/behavior worksheet, owning type tests,
this report and preceding S144 bookkeeping. Raw logs:
`implementation/evidence/logs/s145-*.log`.
No remaining failure, blocker or scope deviation. Repository boundaries and
accepted criteria remain intact. Continue original S146 after the green commit;
separate S148 and full MVP acceptance remain open.
