# S116 step report — Exact distinct Alert Dialog API

Author: Codex. Candidate; separate S128/RCLD-07 acceptance remains pending.
Original S001–S115 independent acceptance and all203 definitions are preserved.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S116","kind":"report","commit":null,"disposition":"candidate"}
-->

The component map freezes the actual pinned namespace's nine parts and eighteen
eventual flat value/type exports. Types directly alias AlertDialog Root, Trigger,
Portal, Overlay, Content, Title, Description, Action and Cancel public types,
preserving refs, snippets, attributes and native policy/callback configuration.
There is no Close alias, Root DOM/modal/role/confirmation API or application
decision state. In particular, the actual public ContentProps retains native
onInteractOutside; its narrower internal WithoutHTML type is not substituted.

Native source inspection establishes distinct Root context, Content autofocus,
outside-ignore default, cancelable Escape and Cancel close. Action has no
automatic close handler; application-owned decisions may explicitly update open.
These are the frozen native boundaries, with actual wrapper/browser qualification
still required in original S117–S121. Shared visuals are deferred to S120 under
the established Dialog/token vocabulary, not the reference's simple Alert item.

Nineteen strict compiler/registration controls pass: representative native
props/refs/snippets, exact equality of all nine public types, causal negatives
and actual production view refusal with REGISTRY_ITEM_UNKNOWN. The candidate
stays unregistered; the existing complete Dialog cohort is preserved. The first
run passed18/19 because the non-existent Close export correctly produced the
pinned compiler's TS2724 suggested-member diagnostic instead of TS2305. The
causal diagnostic classifier now recognizes that exact missing-member category;
all diagnostics still must originate in the fixture, with skipLibCheck=false.
No type is weakened or declaration error suppressed.

Typecheck, lint, formatting, maintained fixture check zero errors/warnings,
governing contract/projection validation and diff checks pass. Conditional Cargo
scope remains unchanged and no reference source is modified. AC20 and all later
catalog/platform/package/delivery criteria remain open. This is authored API
qualification, not independent sequence or full MVP acceptance.

Raw evidence: `implementation/evidence/logs/codex-r10/s116-*`. Next original
checkpoint is S117, with green within-sequence advancement under the active
owner-authorized range and separate S128 acceptance before S129.
