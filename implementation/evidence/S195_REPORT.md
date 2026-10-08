# S195 implementation report — packed complete-catalog consumer

Author: Codex. Candidate; separate final S203 acceptance remains required.
Implementation commit: `2aeec283befbb9380a53898e2ad2b8874218f71b`.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S195","kind":"report","commit":"2aeec283befbb9380a53898e2ad2b8874218f71b","disposition":"candidate"}
-->

`tests/helpers/packaged-consumer.ts` uses the actual isolated build, pack and
offline installation from S194. Each default/custom application explicitly
installs its declared, pinned dependencies through pnpm, then the installed CLI
initializes and adds all 22 actual bundled items. The application manifest is
byte-identical before and after these commands and has no kit runtime dependency.
Every generated owned file matches its recorded base hash; installed registry
source matches adopted component bytes. An AST graph audit checks local and
external imports, and actual consumer imports exercise all 60 value and 69 type
exports.

Copied installed assets provide explicitly synthetic incoming Button versions,
not a claimed release history. Pure dry sync preserves the complete application
tree. Safe sync adopts incoming source while preserving local Badge source,
ownership metadata and application CSS. Stable replay and strict doctor preserve
the tree. A genuine local/incoming Button conflict exits 10 without changing any
application bytes, modes, links or hidden entries. The final graph is audited
again after these transitions.

The installed CLI and copied incoming registry are physically removed before
application check, production build, SSR or browser verification. Production
files receive SHA-256 digests; actual SSR returns 200 with the safe source marker
and authenticates the built handler. The consumer uses ordinary generated source
and its explicit application dependencies. JSON provenance, complete command
transcripts, lock records, production hashes and SSR output are retained under
`implementation/evidence/logs/packaged-consumer` and browser artifacts.

`tests/browser/packaged-consumer.spec.ts` exercises full-catalog hydration, live
CSS customization, unique IDs and live relationships, Text editing, native Switch
and Checkbox state, Collapsible, separate Dialog/Alert Dialog semantics, focus
restoration, and Menu keyboard navigation, disabled skipping and selection across
close/reopen. Application-owned bound selection survives portal unmounting;
Svelte's explicit initial-value capture preserves subsequent user selection.
The existing strict browser collector covers errors and hydration warnings
through page closure. `tests/package/generated-consumer.test.ts` independently
constructs both applications and retains their provenance.

Earlier failed runs remain evidence: an invalid synthetic manifest field was
corrected to `version`; the Menu checked indicator contributes to its accessible
name; a fixed fixture value reset on portal remount and was replaced by explicit
application state; implicit initial prop capture failed the zero-warning checker
and was made explicit. No product contract or assertion was weakened.
One later run passed the four default-layout cases but exceeded the custom
setup's four-minute aggregate hook budget. The setup now has a bounded ten-minute
budget for independent packing, installation, complete-tree checks and both
application compiler commands; their individual timeouts remain unchanged.

Fresh Chromium verification passes 8/8 with zero skips in 7.0 minutes, including
both actual isolated complete-catalog applications. The full package lane passes
9/9 across all four files with zero failures, skips, TODOs or cancellations.
Root typecheck, lint, full formatting and contract validation pass. The initial
lint run found an unnecessary regular-expression escape; removing that redundant
escape preserves the predicate, and all static checks were rerun green. Commands:

```sh
pnpm exec playwright test --config playwright.config.ts tests/browser/packaged-consumer.spec.ts --output=implementation/evidence/logs/s195-browser-complete-artifacts
node tools/run-unit-tests.mjs --suite package
pnpm run typecheck
pnpm run lint
pnpm run format:check
pnpm run check:contracts
```

The browser transcript is `implementation/evidence/logs/s195-browser-complete.log`;
its artifact directory contains both applications' complete packed provenance.
Both applications record 79 production file hashes, successful check/build,
SSR status 200 and 73 unique live IDs without missing references. The package
transcript is `implementation/evidence/logs/s195-package-full.log`.
Final static logs are `s195-{typecheck,lint,format,contracts}-final.log` under
`implementation/evidence/logs`. Earlier failed runs and artifacts remain retained
there with their original filenames; none is reported as a passing run.

The maintained consumer still uses its previously qualified temporary
`skipLibCheck: true` setting. This check is not a raw strict-declaration pass and
does not waive final AC20: the two upstream TS2590 diagnostics remain open for
S196 compatibility work and final cumulative qualification. Cargo guards are N/A
for these TypeScript/Svelte test and evidence changes. Original criteria,
reference sources, registry assets and dependency policy are preserved. S196 is
the next original checkpoint after the verified candidate commit.
