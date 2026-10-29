/** Independent fixtures retain the owner's one authored version catalog as data. */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parse, stringify } from "yaml";
export function writeFixtureWorkspace(
  root: string,
  owner = process.cwd(),
): void {
  const workspace = parse(
    readFileSync(path.join(owner, "pnpm-workspace.yaml"), "utf8"),
  );
  writeFileSync(
    path.join(root, "pnpm-workspace.yaml"),
    stringify({
      packages: ["."],
      catalog: workspace.catalog,
      minimumReleaseAgeExclude: workspace.minimumReleaseAgeExclude,
    }),
    { flag: "wx" },
  );
}
