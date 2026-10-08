# RCLD-06 independent-review repair candidate

Author: Codex. Original S092–S115 remain pending independent acceptance;
S116 remains gated. The reviewed code was `c94ea07`, frozen at `4e0b00f`.
No original criteria or previously accepted checkpoints change.

The separate reviewer reproduced a native form ownership failure: replacing an
external form with a new element of the same ID resets the real checkbox but
leaves Switch unchecked. The bridge now captures reset in the checkbox's actual
tree and checks its current native owner at event time. It preserves the native
per-instance seed, cancellation settlement, one named field and pending-timer
cleanup. Installed default/custom browser regressions cover same-ID replacement,
canceled and unrelated resets, alongside existing native forms and teardown.

The separate reviewer also reproduced a supported Element portal inside a
ShadowRoot containing a real Description whose reference the document-only
guard removes. The guard now resolves IDs and observes mutations in Content's
actual Document or ShadowRoot. IDs, state and portal mounting remain native.
Default/custom installed production applications compare the raw Bits positive
control, rename/restore IDs, physically remove/reinsert the real description and
prove the one owned shadow observer disconnects after close. Existing document
description unmount, ref replacement and root teardown coverage remains intact.

Verification, all final lanes exit0 with zero skipped tests:

- Switch Chromium18/18 and Dialog hydration/teardown15/15.
- Tree-local Dialog Chromium2/2, including observer lifetime proof.
- Owning installed Switch/Dialog, production SSR and core integration11/11.
- Registry46/46; strict native component contracts24/24.
- Real packed core workflow and inventory3/3.
- Typecheck, lint, formatting, contract validation/projection and diff checks.

Raw evidence: `implementation/evidence/logs/codex-r10/r6-repair-*`, complete
application check/build logs and production hashes under `logs/generated-consumer/`,
and per-case browser `generated-consumer.json` artifacts. The initial shadow
fixture lacked the harness-required second public type import and failed before
build. After that setup repair, inner toggle clicks dismissed through native
shadow-event retargeting; that attempt is retained, not counted as passed. The
tree-local physical-reference regression uses real DOM removal/reinsertion rather
than relying on unrelated pointer dismissal; original full Dialog interaction
criteria remain unchanged and covered by their own lanes. Failed browser artifacts
are retained under `r6-repair-browser-before/` and `r6-repair-shadow-before/`.

This is authored repair evidence, not independent acceptance. Earlier full
integration725/725 and Chromium117/117 establish the preceding candidate, not a
fresh cumulative run of this repair. AC20's two qualified upstream declarations,
four ignored reference tests, later catalog/platform/delivery criteria and full
MVP acceptance remain open. Conditional Cargo scope is unchanged; no reference
source or remote action occurred.
