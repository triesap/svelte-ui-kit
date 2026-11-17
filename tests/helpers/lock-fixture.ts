/** Complete the independent structural lock fixture roles. This is data only;
 * it supplies no framework, filesystem, composition or writer authority.
 * Explicit malformed/duplicate records remain intact for owning refusal tests.
 */
export function completeLockFixture(
  value: Record<string, unknown>,
  mapping: { uiDir?: string; stylesDir?: string } = {},
): Record<string, unknown> {
  if (value.integrations !== undefined && !Array.isArray(value.integrations))
    return value;
  const supplied = Array.isArray(value.integrations) ? value.integrations : [];
  const defaults = [
    {
      kind: "layout",
      path: "src/routes/+layout.svelte",
      contract: "layout-v1",
    },
    {
      kind: "stylesheet",
      path: `${mapping.stylesDir ?? "src/styles"}/kit.css`,
      contract: "stylesheet-v1",
    },
    {
      kind: "exports",
      path: `${mapping.uiDir ?? "src/lib/components/ui"}/index.ts`,
      contract: "exports-v1",
    },
  ].map((record) => ({ ...record, baseline: "e".repeat(64) }));
  return {
    ...value,
    integrations: [
      ...supplied,
      ...defaults.filter(
        (record) =>
          !supplied.some(
            (entry: unknown) =>
              entry !== null &&
              typeof entry === "object" &&
              "kind" in entry &&
              entry.kind === record.kind,
          ),
      ),
    ],
  };
}
