# Status native feedback and decorative content contract

Current qualification status: original family gates through S193 are independently
accepted. Checkpoint-era pending/gated statements below retain historical
provenance. The selected native baseline and final release remain candidates
under [current qualification](../../implementation/evidence/COMPATIBILITY.md#current-native-and-source-boundaries)
and the sole governing ledger; separate S203 acceptance remains required.

Original S167–S169, R03, R20, R22, R26, R32, R33, R34.

The immutable source renders one paragraph with `.kit-status`, caller class and
required children. StatusRole supports status/alert, default status;
StatusPoliteness supports polite/assertive, default polite; atomic is boolean,
default true. Preserve those bounded source options as exported type aliases
alongside Status/StatusProps. Do not add role none, severity/size variants,
notification delivery, timers, callbacks, stores, IDs, portals or compound parts.
No primitive dependency is justified for this native presentation.

Intersect actual Svelte paragraph attributes with required no-argument Snippet,
optional HTMLParagraphElement ref, bounded role/politeness and boolean atomic.
Native attributes, class/style, naming, data/ARIA, hidden/tabindex and events remain
native. Actual aria-live accepts off and native aria-atomic accepts native values;
when explicitly supplied these native attributes override the corresponding
source recipe default/option. Undefined uses the source option; explicit null
omits the native attribute, leaving role-implied browser defaults. This preserves
native caller intent instead of accepting and silently discarding attributes.
Reject unsourced props, foreign refs, invalid source/native ARIA values and
contradictory roles. No copied broad native unions or dependency skipLibCheck.

Normal non-urgent feedback uses status/polite/atomic true. The source alert and
assertive options support urgent feedback independently; urgency/message selection
belongs to the application. Decorative duplicates use native aria-hidden true;
this conceals their complete accessible subtree while retaining source DOM role.
Do not fabricate a role-none variant or duplicate announcements. Native paragraph
content constraints remain meaningful: application inline children, optional
explicit name, and aria-hidden decorative spans, without invented headings.
An initially empty paragraph can retain its node/ref as application text changes.
No automatic focus or keyboard/action behavior. Conditional teardown clears ref;
SSR content/options are request-local without delivery effects or shared state.

Preserve all five source CSS declarations: margin zero; status-color/text fallback;
status-font-size/1rem; status-font-weight/400; status-line-height/1.4. The four
source component hooks must join append-only customization metadata when the item
is registered at S168; no guessed motion/palette/variant hooks. One status managed
block and compatible source/style cohort, two flat source targets, four flat
exports, tokens-only registry dependency and empty npm list. Actual default/custom
CLI compile/build/SSR/replay is S168; live/AX/decoration/update/ref semantics,
computed hook values/themes/contrast/RTL/reduced motion are S169. Browser evidence
does not imply measured speech from every screen reader. Mandatory separate S181
and later platform/MVP acceptance remain open.

S169 real default/custom production apps qualify native paragraph role/polite/
atomic defaults against direct controls, urgent source role/politeness/atomic
changes on one retained node, caller off behavior, meaningful empty-to-message
updates, accessible naming and exclusion of decorative copies. Chromium exposes
an empty until-found status node while concealing children. Retained content does
not move focus, clone messages or create a notification service. Strict browser
and server collectors remain active. All five computed declarations, four direct
source hooks/fallbacks, live themes, three measured contrast combinations, caller
native focus/events/forms/refs, RTL/reduced motion and sixteen distinct production
SSR responses are qualified. This is browser/tree evidence, not measured speech.
