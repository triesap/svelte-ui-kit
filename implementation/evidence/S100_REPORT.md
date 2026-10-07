# S100 step report — Installable native Button and composed CSS

Author: Codex. Candidate; mandatory independent S115 acceptance remains pending.
Original checkpoint criteria and accepted S001–S091 remain preserved.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S100","kind":"report","commit":null,"disposition":"candidate"}
-->

Native Button forwards actual button attributes/events, combines caller and
design classes, binds the actual element ref, and defaults to type button.
Loading or disabled disables the element; loading owns aria-busy, adds one
loading label and a decorative sibling Spinner, and hides the retained children
content. The wrapper imports source/type siblings directly, without a root
barrel, CLI dependency, primitive shim or styled runtime.

The real manifest exports Button and three native types in one source/style
cohort. Add button requests only button; Spinner and tokens are transitive.
The full reference Button CSS is adapted to its target layer/managed block,
retaining every selector/declaration and twenty inherited CSS hooks. Nineteen
non-radius hooks add compatible customization-v1 declarations; tokens item0.1.2
records the changed metadata content. The original44 defaults and30 radius
definitions remain unchanged. Button's spinner-size feeds Spinner's published
dimensions so deterministic tokens-first lexical CSS ordering cannot erase its
composition override. Original sizing declarations remain intact.

Real init/add default/custom consumers import all public types, check and
production-build, and render the actual handler. SSR proves native default
type, default/design/caller classes, disabled/busy/loading label, decorative
mark without duplicate status, and retained children markup. Copied source/type
bytes and every installed base hash equal their actual inputs. Dry-run, add
replay and sync preserve complete trees. Combined Button/Spinner/tokens/metadata
checks20/20, registry44/44, packed inventory1/1, Chromium39/39, maintained fixture
check zero errors/warnings and build, typecheck and lint pass. The full final integration lane passes714/714;
a compiler-AST self-review retains all41 source CSS declarations with only
two native Spinner composition additions. Formatting and
governing contracts/projection are checked before commit.

Initial tests incorrectly expected dependency-order CSS rather than the
established lexical order, omitted Svelte SSR comment markers, and counted
nineteen Button hooks without its multiline radius declaration. Those evidence
assumptions were corrected; no product validator or criterion was weakened.
One mistyped owning test filename was refused by the runner and rerun with the
real repository path. All initial failures remain in raw evidence under
`implementation/evidence/logs/codex-r10/s100-*`. Conditional Cargo is N/A.
Runtime keyboard/forms/ref/children/focus/theme/customization remain original
S101, not inferred from SSR. AC20, later requirements and independent sequence
acceptance remain open; no full MVP completion is claimed.
