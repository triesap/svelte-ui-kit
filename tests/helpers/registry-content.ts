import { readFileSync } from "node:fs";
import path from "node:path";
import { computeRegistryContentHash } from "../../src/registry/model.js";
import { sha256Hex } from "../../src/codegen/digest.js";
import { write } from "./cli-package.js";

/** Re-sign only an owned fixture, including every explicit advertised input. */
export function refreshRegistryContent(root: string): void {
  const registry = JSON.parse(
    readFileSync(path.join(root, "registry/registry.json"), "utf8"),
  );
  const paths = new Set<string>();
  for (const entry of registry.items) {
    const file = `registry/${entry.manifest}`;
    paths.add(file);
    const item = JSON.parse(readFileSync(path.join(root, file), "utf8"));
    for (const asset of [...item.files, ...item.styles])
      paths.add(`registry/${asset.source}`);
    for (const source of Object.values(item.contracts ?? {}))
      paths.add(`registry/${source}`);
  }
  const assets = [...paths].map((file) => ({
    path: file,
    digest: sha256Hex(readFileSync(path.join(root, file))),
  }));
  write(
    root,
    "registry/registry.json",
    JSON.stringify({
      ...registry,
      contentHash: computeRegistryContentHash(registry, assets),
    }),
  );
}
