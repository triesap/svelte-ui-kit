# Gated extension direction

<!-- Adopted at S002 from the governing RCLD sequence. This file governs product intent; implementation/COMMIT_SEQUENCE.md remains the execution/status authority. -->

Status: approved direction; **not implemented and not yet API-specified**.

The review recommended extending the stable generator/wrapper architecture to select, combobox, popover, date-related components, and higher-level patterns after core and original-catalog parity. This direction remains part of project intent. The approved review did not supply enough public API or behavior detail to write a truthful complete coding sequence for these items.

#### Required next specification inputs

For select/combobox: exact item set and modes, values/generics, controlled/uncontrolled behavior, filtering/search ownership, form/validation behavior, rendering/snippet/ref policy, async behavior only if requested, disabled/empty/loading states, accessibility tests and styling contracts.

For popover: exact composition/defaults and relationship to already qualified portal/floating machinery; focus/dismissal semantics and CSS contract. Do not assume it is Dialog with a renamed class.

For date-related items: exact inventory (not every Bits date component), value types, locale/calendar/timezone responsibility, form serialization, formatting/validation, range behavior only if requested, and dependency/cross-request requirements. No date/timezone policy is invented by this specification.

For higher-level patterns: named examples and scope; distinguish composition recipes from new primitive/state/async systems. Existing accordion-like, alert/status, breadcrumb/pagination and native-table compositions stay lightweight.

#### Output of the scheduled gate

Record stable reusable infrastructure, remaining product questions, exact contracts to freeze, dependency/API evidence, and acceptance criteria. Only after the missing scope is settled should an agent create the next numbered commit sequence. Do not call the core release an implementation of these extensions. Do not substitute hundreds of speculative steps for the missing human intent.
