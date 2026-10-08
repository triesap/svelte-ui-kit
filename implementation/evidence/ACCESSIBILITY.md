# Observed catalog accessibility states

S188 author qualification candidate. Mandatory independent S193 acceptance and
final AC20 remain open. This records the pinned Chromium/native primitive
boundary; it is not screen-reader interoperability or whole-application WCAG
certification.

The actual 22-item installed catalog is checked in default/custom layouts and
LTR/RTL directions. Browser tooling captures Chromium's complete accessibility
tree and verifies nonempty control names, roles, native required state, explicit
invalid state, progress, decorative versus status Spinner and disabled/busy
Button feedback. Direct keyboard cases verify Radio/Tabs navigation that skips
disabled parts, Menu focus/disabled skipping/Escape, Checkbox/Switch state,
logical Switch-thumb travel and visible focus. Dialog focus cycles through its
live controls, exposes the real name/description and returns to its trigger;
Alert Dialog uses the distinct named role and native focus return.

Actual reduced-motion media removes Spinner animation and relevant transitions
while controls, Collapsible content, status/progress and Dialog stay usable.
Strict issue collection covers hydration, runtime and teardown. These checks
pair browser semantic tooling with actual state/focus assertions rather than
relying on an accessibility snapshot alone.

## Rendered source contrast

The measured fixture uses the original canvas and semantic source tokens, not
a replacement palette. Text is entered into the actual controls. Twenty-three
foreground/background observations per layout/direction use the rendered
opaque backdrop, excluding hidden or fully transparent text. The visible
Select recipe label is measured separately from its transparent native select.
Every observed ordinary text ratio exceeds 4.5 without rounding the threshold;
the lowest is the invalid Field message at 4.615804459238792. The ordinary text
threshold and inactive/decorative exception follow
[W3C's contrast-minimum guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

Two source non-text concerns remain explicit:

| Observed pair                                      | Actual colors                               | Ratio              |
| -------------------------------------------------- | ------------------------------------------- | ------------------ |
| Unchecked Radio boundary versus its white interior | `rgb(209, 213, 219)` / `rgb(255, 255, 255)` | 1.4735129263833868 |
| Unchecked Switch track versus white thumb          | `rgb(156, 163, 175)` / `rgb(255, 255, 255)` | 2.5388412065932826 |

Both fall below the 3:1 comparison discussed in
[W3C's non-text-contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).
Identifying required boundaries and the effects of the rest of a particular
application still requires assessment. These are recorded source concerns
under AC18, not a claim that they pass that threshold or an unapproved palette
redesign. The independent gate must assess this bounded original-source
disposition; any required unresolved issue blocks release. Arbitrary caller
themes, disabled affordances, every token combination, all fonts and every
assistive technology are not certified by these observations.

Full precision, native accessibility trees, focus/state records, reduced-motion
records and installed artifact digests are retained in the owning S188 browser
artifacts. See the S188 checkpoint report for exact commands and the required
full browser regression result.
