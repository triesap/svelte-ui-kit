# S132 step report — Radio group selection and form API

Author: Codex. Locally verified candidate; independent S148 acceptance pending.
Implementation commit will be recorded after the green commit.

Original requirements R03, R20, R22, R26, R32, R33, R34. Starting
`175c15b6404f04bc4bf7d634afce24993e97f3e7` on `master`.

The immutable native Radio source/manifest/CSS and actual Bits RadioGroup2.19.3
public Root/Item types, components, state, roving focus and value field were
inspected. Exactly RadioGroup/RadioGroupProps and RadioItem/RadioItemProps are
frozen. Group value/ref, Item required string value/ref, orientation/loop,
required/disabled/readonly/name, native attrs/events/classes/style and actual
checked/default/delegated snippets retain pinned types. Label composition uses
actual group/item IDs and visible labels/fieldset/legend rather than an invented
label API. Item button form is a native attribute; Group form convenience props
are unsupported, and the single successful Group value field is distinguished
from item button association.

The source selected mark is fixed radial-gradient paint, with no separate source
or native Indicator component. Freeze two parts/four exports/four source files
plus one managed CSS asset, preserving source geometry/colors/focus/disabled and
the sole existing radio radius fallback. No checked boolean, array value, index,
extra indicator, public selection store, new token or arbitrary variant is adopted.
Candidates stay unadvertised until original S134.

The worksheet records the actual pinned offscreen text field and pending form
reset/validation obligations. If actual consumer probes demonstrate stale Group
state, the narrow one-field current-owner/canceled-reset bridge must be qualified
under S133/S135. No keyboard or roving-focus engine is authorized. This type freeze
is not a claim of pending browser/form or independent acceptance.

Commands through `cargo extbuild run --` after green doctor, Node24.21.0:

- `node tools/run-unit-tests.mjs --suite components tests/components/radio-types.test.ts`: final14/14, exit0; exact positive native props/snippets and thirteen causal fixture-only invalid contracts, strict library checking.
- `pnpm run fixture:check`:exit0, maintained consumer zero errors/warnings.
- `pnpm run typecheck`, final `pnpm run lint`, `pnpm run format:check`, `pnpm run check:contracts`:exit0; contracts zero errors/warnings. Initial lint caught two unused imports from the type-fixture template; removed, then lint and owning component cases reran green. No suppression or type widening.
- `git diff --check`, staged check/review:exit0. Conditional Cargo N/A.

Files: `specs/component-maps/radio.md`, `registry/ui/radio/types.ts`,
`tests/components/radio-types.test.ts`, this report and prior S131
checkpoint/projection/report bookkeeping. Original203 criteria and previously
accepted work remain unchanged. Parent/reference/remotes preserved. No blocker
or scope deviation. Raw logs: `implementation/evidence/logs/s132-*.log`.
Continue original S133 wrappers after the green candidate; separate S148
acceptance gates S149, and later catalog/platform/package/AC20 criteria remain.
