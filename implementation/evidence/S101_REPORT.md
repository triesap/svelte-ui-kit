# S101 step report — Generated Button browser/forms qualification

Author: Codex. Candidate; independent S115 acceptance remains pending.
Original criteria and accepted S001–S091 remain unchanged.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S101","kind":"report","commit":"9d1796acae84e62c47f92ee834ff0f7382f8ce4e","disposition":"candidate"}
-->

Eight Chromium Button cases pass on actual default/custom CLI-installed,
typechecked, production-built consumers. Tests prove default type button does
not submit; click, Enter and Space each forward the caller handler once;
explicit submit includes actual edited field and submitter name/value; native
reset restores the initial field value. Caller classes/data/title survive and
the actual bind:ref receives the button and focuses it.

Disabled and loading suppress native activation. Busy exposes one Loading or
updated loadingLabel name; decorative Spinner produces no redundant status.
Children remain in the DOM but hidden while loading, then become visible again.
The restored button enables and forwards activation. All three variants and
sizes render; inherited control radius, exact elliptical radius, primary theme
colors, actual keyboard focus-visible/outline and customized composed Spinner
size pass computed-style checks. The unchanged Spinner qualification rerun
brings the combined generated-browser total to16/16 with strict page issue and
owned-server teardown enforcement.

The existing owned consumer helper now selects Button or Spinner, inserts the
explicit mapped route only in owned copies and checks exact generated source
bytes. Per-case retained artifacts include source/type, generated barrel, route,
lock, stylesheet and actual production handler hashes. The maintained source
fixture remains pristine. Twelve real Button compiler fixtures, typecheck,
lint, maintained fixture check zero errors/warnings and production build,
formatting and governing contracts/projection pass. Raw logs:
`implementation/evidence/logs/codex-r10/s101-*`; per-case hashes remain under
ignored browser output. Platform is Darwin arm64, Node24.21.0 and the pinned
headless Chromium project; no Windows or alternative browser claim.

The first lint run refused a mutable URLSearchParams in the owned route template.
Its event-local encoding now uses pinned SvelteURLSearchParams; no lint rule was
disabled and no product type/runtime was changed. Final owning browser and lint
checks are rerun on that template; the original diagnostic remains retained.

Conditional Cargo is N/A. Original AC20 and later catalog/platform/package
requirements remain open. No independent RCLD-06 or whole MVP acceptance is
claimed. Next original checkpoint is S102 Switch binding/composition contract.
