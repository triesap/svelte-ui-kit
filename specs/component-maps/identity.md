# Identity parity through pinned native component facilities

Current qualification status: original family gates through S193 are independently
accepted. Checkpoint-era pending/gated statements below retain historical
provenance. The selected native baseline and final release remain candidates
under [current qualification](../../implementation/evidence/COMPATIBILITY.md#current-native-and-source-boundaries)
and the sole governing ledger; separate S203 acceptance remains required.

Original S179–S180, R03, R21, R22, R26, R28, R29, R32, R33, R34.

Disposition: deliberately non-generated. Immutable source KitIdProvider and
use_kit_id provide scoped ordinal identities for Rust components. Do not port
that provider/counter API or publish a fake identity item/alias. Existing pinned
Svelte5.57.1 and Bits2.19.5-svelte-ui-kit.2 already supply the required per-instance identity,
native label/control associations and title/description relationships. No
app-owned helper improves those facilities; no new source/export/style/dependency
or registry target is justified. The original identity catalog entry remains an
explicit documented adaptation, not an omitted or installable item.

Original full-catalog S189 qualification measured the native Menu floating
positioning wrapper. Current R11-F05 catalog SSR replay reassesses it on the
selected Bits 2.19.5-svelte-ui-kit.2 build, which gives that nonsemantic wrapper a `useId()`
process-counter default, distinct from its component part `$props.id()` IDs.
The direct native Menu control and installed catalog both show varying
`data-bits-floating-content-wrapper` IDs across repeated server requests.
Every semantic component/form ID repeats for equivalent requests; every
document has unique IDs and all emitted relationships resolve after hydration.
No kit counter or identity API is added. The original bounded disposition passed
independent S193 qualification; the current native candidate still requires
separate S203 acceptance. It is not a claim that the native
floating wrapper allocation is request-local.

| Affected source                            | Native identity and relationship ownership                                                                                                                                                                                                                                               |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FieldRoot                                  | One instance `$props.id()` supplies the default root base; caller id wins. Context controlId uses caller controlId or base-control. Message IDs derive deterministically from base and URI-encoded caller message keys; keys must remain unique within the root.                         |
| TextInput, TextArea, NativeSelect          | Native id uses explicit caller id, then Field context controlId, then the control's own `$props.id()`. FieldLabel uses explicit for or the current root context. A caller overriding a native control ID must align the root controlId or explicit label-for.                            |
| TextField, TextAreaField, SelectField      | Convenience id belongs to the Field root/base; internal automatic label/control/message associations follow that root. It is not a compatibility alias for a separate control's native id.                                                                                               |
| Switch, Checkbox, Radio, Tabs, Collapsible | Thin wrappers preserve actual Bits part id props and native `$props.id()` defaults. Application labels use explicit IDs or existing component/ref facilities; no copied global ordinal provider. Radio/Tab/Collapsible relationship state remains primitive-owned.                       |
| Dialog, Alert Dialog, Menu                 | Bits part IDs and registration own trigger/content/title/description relationships; actual caller part IDs pass through. Existing description guards retain only references to live nodes in the actual Document/ShadowRoot and clean up observers. They do not generate or replace IDs. |
| Other native presentation items            | Caller IDs/ARIA/labels remain native; no implicit IDs, extra associations or shared counters are introduced.                                                                                                                                                                             |

Inspect the actual pinned implementation: Bits createId is a pure bits-prefix
formatter of the component's `$props.id()` result. Svelte server GlobalRenderer
constructs its uid allocator per render, emits a hydration comment for props_id,
and client props_id consumes that same comment. Post-hydration new instances use
the framework-owned browser c-prefix allocator. This framework facility is not a
package-owned process-global counter or copied provider. Field's shared Symbol
is a context key; actual relationship values belong to each FieldRoot instance.

IDs are document-scoped. Equivalent render trees can reuse the same generated
IDs in different requests; that is not shared mutable request state. Application
explicit IDs must remain unique in their actual tree. Separately rendered SSR
roots embedded into one document can use Svelte's existing render idPrefix option;
do not invent a kit provider or promise uniqueness for duplicate caller IDs.
Hydration requires the application to retain the initial server component tree;
supported conditional changes after hydration allocate new native identities.
Do not suppress SSR/hydration or rewrite labels to hide an unsupported tree.

Preserve pinned native registration boundaries already qualified for Tabs/
Collapsible and initially open inline Dialog/Alert Dialog: some inferred references
complete during child registration/hydration. Identity generation does not itself
guarantee every primitive relationship is inferred in an earlier SSR evaluation.
Where initial SSR needs a name, native caller aria-label remains available; real
controls and conditional/repeated lifecycles must qualify actual live references.
S179 contract/source audit establishes this bounded non-generated strategy; S180
tests actual installed multiple controls/fields/dialogs, repeated/concurrent SSR,
hydration, explicit overrides and conditional lifecycle. Original S181 and S193
gates are accepted; the changed native baseline and final MVP gate remain open.
No primitive state/provider clone,
compatibility alias or identity styling is introduced.
