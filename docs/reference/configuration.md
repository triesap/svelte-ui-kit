# Configuration and generated layout

All paths are relative to one selected SvelteKit application package. `--cwd`
selects that package; the CLI does not scan and mutate every workspace member or
execute application configuration/scripts to discover it. Configuration is
validated against the [v1 schema](../../schema/v1/kit.schema.json).

## Desired configuration

The default configuration is `src/lib/components/ui/_kit/kit.json`. It stores
`schemaVersion`, the `builtin` registry, integration mappings and **explicit root
requests**, rather than replacing requests with dependency closure.

| Field           | Meaning                                                                  |
| --------------- | ------------------------------------------------------------------------ |
| `schemaVersion` | Supported configuration schema version, currently 1.                     |
| `registry`      | Built-in registry only; currently `builtin`.                             |
| `uiDir`         | Local source and root export directory; default `src/lib/components/ui`. |
| `stylesDir`     | Aggregate and application stylesheet directory; default `src/styles`.    |
| `layoutFile`    | Explicit supported root layout or statically detected layout.            |
| `requested`     | Unique installable root IDs deliberately selected by the app.            |

Unknown fields, duplicate requests, unsupported versions, unsafe/overlapping paths
and ambiguous project identity fail visibly. Framework, CLI, registry, item and
schema versions have independent meanings; a framework bump is not a migration.

## Custom mapping

Before initialization, create `app/ui/_kit/kit.json` in the selected application:

<!-- documented-custom-mapping:start -->

```json
{
  "schemaVersion": 1,
  "registry": "builtin",
  "uiDir": "app/ui",
  "stylesDir": "assets/styles",
  "layoutFile": "src/routes/+layout.svelte",
  "requested": []
}
```

<!-- documented-custom-mapping:end -->

Exactly one discovered `_kit/kit.json` may identify the installation; its location
must agree with `uiDir`. Discovery is deterministic and read-only, excludes VCS,
dependencies/build outputs and nested package roots, and never follows symlinks.
No candidate uses the default bootstrap location. Multiple, malformed or
mislocated candidates fail rather than selecting one by accident.

## Installed observations

The [lock schema](../../schema/v1/kit-lock.schema.json) owns installed lineage:
requested versus transitive origin, registry/item identities, file/CSS cohort
owners, baseline hashes and integration contracts. Commit this tool-managed
semantic metadata. Do not edit hashes to hide local work. Ephemeral coordination,
staging and journals are distinct recovery evidence, not desired configuration.

## Source, exports and styles

Simple components use kebab-case files; compound families have directories and
flat PascalCase root exports. Generated wrappers import local siblings and native
APIs, never CLI internals or a styled kit runtime. The root barrel's managed
regions preserve unrelated exports. The tool does not create a parent components
barrel merely to imitate another framework.

`kit.css` aggregates managed component blocks. `themes.css` and `app.css` remain
application-owned. Supported layout integration imports kit, themes, then app CSS
without replacing existing route rendering or unrelated layout code. Unsupported,
dynamic or ambiguous integration stops with an actionable manual step.
See [styling](../guides/styling.md), [upgrading](../guides/upgrading.md) and
[recovery](../guides/recovery.md).
